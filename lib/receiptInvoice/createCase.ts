import crypto, { randomUUID } from 'crypto';
import { Prisma, ReceiptInvoiceCaseType } from '@prisma/client';

import prisma from '@/lib/prismadb';
import { aggregateReceipts, type ReceiptTotals } from './money';
import {
  createReceiptInvoiceDocumentPdf,
  type ReceiptPdfSource,
} from './createReceiptInvoicePdf';
import { removeReceiptInvoiceFiles, uploadReceiptInvoicePdf } from './storage';
import {
  isCompleteBillingAddress,
  type BillingAddressInput,
  type CreateReceiptInvoiceCaseResponse,
  type CreateReceiptInvoiceConfiguration,
  type ParsedTebiReceipt,
  type ReceiptInvoiceMode,
  type ReceiptInvoiceRecipientInput,
} from './types';
import { resolveSplitDocuments, type ResolvedSplitDocument } from './split';

export type ReceiptFileInput = {
  filename: string;
  pdf: Buffer;
  receipt: ParsedTebiReceipt;
};

type ReservationSnapshot = {
  id: string;
  name: string;
  email: string;
  people: number;
  type: string;
  tableNumber: string | null;
  billingAddress: unknown;
};

type PreparedDocument = {
  id: string;
  documentNumber: string;
  recipient: ReceiptInvoiceRecipientInput;
  totals: ReceiptTotals;
  allocations: unknown;
  finalPdfPath: string;
  finalPdfSha256: string;
  finalPdf: Buffer;
};

function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function databaseReceiptDate(value: string): Date {
  const date = new Date(`${value}T12:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Ungültiges Belegdatum.');
  }

  return date;
}

function safeSegment(value: string): string {
  const result = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  return result || 'beleg';
}

function caseType(mode: ReceiptInvoiceMode): ReceiptInvoiceCaseType {
  switch (mode) {
    case 'COLLECTION':
      return ReceiptInvoiceCaseType.COLLECTION;
    case 'SPLIT':
      return ReceiptInvoiceCaseType.SPLIT;
    default:
      return ReceiptInvoiceCaseType.SINGLE;
  }
}

async function uniqueDocumentNumber(
  base: string,
  reserved: Set<string>,
): Promise<string> {
  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;

    if (reserved.has(candidate)) {
      continue;
    }

    const existing = await prisma.receiptInvoiceSupplement.findUnique({
      where: {
        documentNumber: candidate,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      reserved.add(candidate);
      return candidate;
    }
  }

  throw new Error('Es konnte keine eindeutige Dokumentnummer erzeugt werden.');
}

function validateConfiguration(
  configuration: CreateReceiptInvoiceConfiguration,
  mode: ReceiptInvoiceMode,
) {
  if (!configuration || configuration.mode !== mode) {
    throw new Error(
      'Die Konfiguration passt nicht zur ausgewählten Vorgangsart.',
    );
  }

  if (configuration.mode === 'SINGLE' || configuration.mode === 'COLLECTION') {
    if (!isCompleteBillingAddress(configuration.recipient.billingAddress)) {
      throw new Error('Die Rechnungsadresse ist unvollständig.');
    }
  }

  if (configuration.mode === 'SPLIT') {
    if (
      !Array.isArray(configuration.recipients) ||
      configuration.recipients.length < 2
    ) {
      throw new Error(
        'Für eine Aufteilung werden mindestens zwei Empfänger benötigt.',
      );
    }
  }
}

function ensureFileCount(
  mode: ReceiptInvoiceMode,
  sources: ReceiptFileInput[],
) {
  if (mode === 'SINGLE' && sources.length !== 1) {
    throw new Error(
      'Für einen Einzelbeleg muss genau ein PDF hochgeladen werden.',
    );
  }

  if (mode === 'COLLECTION' && sources.length < 2) {
    throw new Error(
      'Für einen Sammelbeleg werden mindestens zwei PDFs benötigt.',
    );
  }

  if (mode === 'SPLIT' && sources.length !== 1) {
    throw new Error(
      'Für eine Aufteilung muss genau ein PDF hochgeladen werden.',
    );
  }
}

async function ensureSourcesAreUnused(sources: ReceiptFileInput[]) {
  const localKeys = new Set<string>();

  for (const source of sources) {
    const key = [source.receipt.receiptNumber, source.receipt.receiptDate].join(
      ':',
    );

    if (localKeys.has(key)) {
      throw new Error(
        `Der Kassenbeleg ${source.receipt.receiptNumber} wurde mehrfach hochgeladen.`,
      );
    }

    localKeys.add(key);
  }

  const sourceConditions = sources.map((source) => ({
    receiptNumber: source.receipt.receiptNumber,
    receiptDate: databaseReceiptDate(source.receipt.receiptDate),
  }));

  const existingSource = await prisma.receiptInvoiceSourceReceipt.findFirst({
    where: {
      OR: sourceConditions,
    },
    select: {
      receiptNumber: true,
    },
  });

  if (existingSource) {
    throw new Error(
      `Für den Kassenbeleg ${existingSource.receiptNumber} wurde bereits ein Rechnungsvorgang erstellt.`,
    );
  }

  // Schützt zusätzlich vor einer erneuten Verarbeitung alter,
  // noch nicht einem Case zugeordneter Einzelbelege.
  const existingLegacy = await prisma.receiptInvoiceSupplement.findFirst({
    where: {
      caseId: null,
      OR: sourceConditions,
    },
    select: {
      receiptNumber: true,
      documentNumber: true,
    },
  });

  if (existingLegacy) {
    throw new Error(
      `Für den Kassenbeleg ${existingLegacy.receiptNumber} existiert bereits ${existingLegacy.documentNumber}.`,
    );
  }
}

async function loadReservation(
  reservationId: string | null,
  required: boolean,
): Promise<ReservationSnapshot | null> {
  if (!reservationId) {
    if (required) {
      throw new Error('Bitte wähle eine Reservierung aus.');
    }

    return null;
  }

  const reservation = await prisma.reservation.findUnique({
    where: {
      id: reservationId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      people: true,
      type: true,
      tableNumber: true,
      billingAddress: true,
    },
  });

  if (!reservation) {
    throw new Error('Reservierung nicht gefunden.');
  }

  return reservation;
}

function documentBaseNumber({
  mode,
  year,
  sources,
  splitIndex,
}: {
  mode: ReceiptInvoiceMode;
  year: string;
  sources: ReceiptFileInput[];
  splitIndex?: number;
}) {
  if (mode === 'COLLECTION') {
    return `SB-${year}-${safeSegment(
      sources[0].receipt.receiptNumber,
    )}-${sources.length}`;
  }

  const sourceNumber = safeSegment(sources[0].receipt.receiptNumber);

  if (mode === 'SPLIT' && splitIndex !== undefined) {
    const suffix =
      splitIndex < 26
        ? String.fromCharCode(65 + splitIndex)
        : String(splitIndex + 1);

    return `KB-${year}-${sourceNumber}-${suffix}`;
  }

  return `KB-${year}-${sourceNumber}`;
}

function fullAllocations(sources: ReceiptFileInput[]) {
  return sources.map(({ receipt }) => ({
    sourceReceiptNumber: receipt.receiptNumber,
    taxLines: receipt.taxLines,
    tipCents: receipt.tipCents,
  }));
}

export async function createReceiptInvoiceCase({
  mode,
  reservationId,
  configuration,
  sources,
}: {
  mode: ReceiptInvoiceMode;
  reservationId: string | null;
  configuration: CreateReceiptInvoiceConfiguration;
  sources: ReceiptFileInput[];
}): Promise<CreateReceiptInvoiceCaseResponse> {
  validateConfiguration(configuration, mode);

  ensureFileCount(mode, sources);
  await ensureSourcesAreUnused(sources);

  const reservationRequired =
    configuration.assignmentType === 'RESERVATION' || mode === 'COLLECTION';

  const reservation = await loadReservation(reservationId, reservationRequired);

  const caseId = randomUUID();
  const storageRoot = `${process.env.NODE_ENV === 'development' ? 'receipt-invoices-dev' : 'receipt-invoices'}/cases/${caseId}`;

  const uploadedPaths: string[] = [];
  const sourceStorage: Array<{
    id: string;
    originalPdfPath: string;
    originalPdfSha256: string;
    input: ReceiptFileInput;
  }> = [];

  try {
    for (let index = 0; index < sources.length; index += 1) {
      const source = sources[index];

      const path =
        `${storageRoot}/sources/` +
        `${String(index + 1).padStart(2, '0')}-` +
        `${safeSegment(source.receipt.receiptNumber)}.pdf`;

      await uploadReceiptInvoicePdf({
        path,
        buffer: source.pdf,
      });

      uploadedPaths.push(path);

      sourceStorage.push({
        id: randomUUID(),
        originalPdfPath: path,
        originalPdfSha256: sha256(source.pdf),
        input: source,
      });
    }

    const pdfSources: ReceiptPdfSource[] = sources.map((source) => ({
      receipt: source.receipt,
      pdf: source.pdf,
    }));

    const reservedDocumentNumbers = new Set<string>();

    const preparedDocuments: PreparedDocument[] = [];

    if (
      configuration.mode === 'SINGLE' ||
      configuration.mode === 'COLLECTION'
    ) {
      const recipient = configuration.recipient;

      const totals = aggregateReceipts(sources.map((source) => source.receipt));

      const year = sources[0].receipt.receiptDate.slice(0, 4);

      const documentNumber = await uniqueDocumentNumber(
        documentBaseNumber({
          mode,
          year,
          sources,
        }),
        reservedDocumentNumbers,
      );

      const finalPdf = await createReceiptInvoiceDocumentPdf({
        documentNumber,
        mode,
        recipient,
        reservation,
        sources: pdfSources,
        totals,
      });

      const finalPdfPath =
        `${storageRoot}/documents/` + `${safeSegment(documentNumber)}.pdf`;

      await uploadReceiptInvoicePdf({
        path: finalPdfPath,
        buffer: finalPdf,
      });

      uploadedPaths.push(finalPdfPath);

      preparedDocuments.push({
        id: randomUUID(),
        documentNumber,
        recipient,
        totals,
        allocations: fullAllocations(sources),
        finalPdfPath,
        finalPdfSha256: sha256(finalPdf),
        finalPdf,
      });
    } else {
      const sourceReceipt = sources[0].receipt;

      const splitDocuments = resolveSplitDocuments(
        sourceReceipt,
        configuration.recipients,
      );

      const year = sourceReceipt.receiptDate.slice(0, 4);

      for (let index = 0; index < splitDocuments.length; index += 1) {
        const splitDocument: ResolvedSplitDocument = splitDocuments[index];

        const documentNumber = await uniqueDocumentNumber(
          documentBaseNumber({
            mode,
            year,
            sources,
            splitIndex: index,
          }),
          reservedDocumentNumbers,
        );

        const finalPdf = await createReceiptInvoiceDocumentPdf({
          documentNumber,
          mode,
          recipient: splitDocument.recipient,
          reservation,
          sources: pdfSources,
          totals: splitDocument.totals,
          splitRecipientIndex: index,
          splitRecipientCount: splitDocuments.length,
        });

        const finalPdfPath =
          `${storageRoot}/documents/` + `${safeSegment(documentNumber)}.pdf`;

        await uploadReceiptInvoicePdf({
          path: finalPdfPath,
          buffer: finalPdf,
        });

        uploadedPaths.push(finalPdfPath);

        preparedDocuments.push({
          id: randomUUID(),
          documentNumber,
          recipient: splitDocument.recipient,
          totals: splitDocument.totals,
          allocations: splitDocument.allocations,
          finalPdfPath,
          finalPdfSha256: sha256(finalPdf),
          finalPdf,
        });
      }
    }

    const firstSource = sources.length === 1 ? sourceStorage[0] : null;

    await prisma.$transaction(async (transaction) => {
      if (
        reservation &&
        (configuration.mode === 'SINGLE' ||
          configuration.mode === 'COLLECTION') &&
        configuration.saveBillingAddress
      ) {
        await transaction.reservation.update({
          where: {
            id: reservation.id,
          },
          data: {
            billingAddress: configuration.recipient
              .billingAddress as unknown as Prisma.InputJsonValue,
          },
        });
      }

      await transaction.receiptInvoiceCase.create({
        data: {
          id: caseId,
          type: caseType(mode),
          reservationId: reservation?.id ?? null,

          sourceReceipts: {
            create: sourceStorage.map(
              ({ id, input, originalPdfPath, originalPdfSha256 }) => ({
                id,
                receiptNumber: input.receipt.receiptNumber,
                receiptDate: databaseReceiptDate(input.receipt.receiptDate),
                tableNumber: input.receipt.tableNumber,
                receiptCreatedAtLabel: input.receipt.createdAtLabel,
                receiptPaidAtLabel: input.receipt.paidAtLabel,
                netCents: input.receipt.netCents,
                vatCents: input.receipt.vatCents,
                subtotalCents: input.receipt.subtotalCents,
                tipCents: input.receipt.tipCents,
                grossCents: input.receipt.grossCents,
                currency: input.receipt.currency,
                taxLines: input.receipt
                  .taxLines as unknown as Prisma.InputJsonValue,
                payments: input.receipt
                  .payments as unknown as Prisma.InputJsonValue,
                originalPdfPath,
                originalPdfSha256,
              }),
            ),
          },

          documents: {
            create: preparedDocuments.map((document) => ({
              id: document.id,
              documentNumber: document.documentNumber,
              reservationId: reservation?.id ?? null,

              receiptNumber: firstSource?.input.receipt.receiptNumber ?? null,
              receiptDate: firstSource
                ? databaseReceiptDate(firstSource.input.receipt.receiptDate)
                : null,
              tableNumber: firstSource?.input.receipt.tableNumber ?? null,
              receiptCreatedAtLabel:
                firstSource?.input.receipt.createdAtLabel ?? null,
              receiptPaidAtLabel:
                firstSource?.input.receipt.paidAtLabel ?? null,

              netCents: document.totals.netCents,
              vatCents: document.totals.vatCents,
              subtotalCents: document.totals.subtotalCents,
              tipCents: document.totals.tipCents,
              grossCents: document.totals.grossCents,
              currency: document.totals.currency,

              recipientCompany: document.recipient.billingAddress.company,
              recipientEmail: document.recipient.email ?? null,
              recipientAddress: document.recipient
                .billingAddress as unknown as Prisma.InputJsonValue,

              taxLines: document.totals
                .taxLines as unknown as Prisma.InputJsonValue,
              payments: sources.map(({ receipt }) => ({
                receiptNumber: receipt.receiptNumber,
                payments: receipt.payments,
              })) as unknown as Prisma.InputJsonValue,
              allocations: document.allocations as Prisma.InputJsonValue,

              originalPdfPath: firstSource?.originalPdfPath ?? null,
              originalPdfSha256: firstSource?.originalPdfSha256 ?? null,

              finalPdfPath: document.finalPdfPath,
              finalPdfSha256: document.finalPdfSha256,
            })),
          },
        },
      });
    });

    return {
      caseId,
      documents: preparedDocuments.map((document) => ({
        id: document.id,
        documentNumber: document.documentNumber,
        pdfUrl: `/api/backend/receiptInvoices/${document.id}/pdf`,
      })),
    };
  } catch (error) {
    await removeReceiptInvoiceFiles(uploadedPaths);

    throw error;
  }
}
