import crypto from 'crypto';
import fs from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';

import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { parseTebiReceiptPdf } from '@/lib/receiptInvoice/parseTebiReceipt';
import { createReceiptSupplementPdf } from '@/lib/receiptInvoice/createReceiptSupplementPdf';
import {
  getBooleanField,
  getStringField,
  getUploadedFile,
  parseMultipartForm,
} from '@/lib/receiptInvoice/parseMultipartForm';
import {
  isCompleteBillingAddress,
  type BillingAddressInput,
} from '@/lib/receiptInvoice/types';
import {
  removeReceiptInvoiceFiles,
  uploadReceiptInvoicePdf,
} from '@/lib/receiptInvoice/storage';

export const config = {
  api: {
    bodyParser: false,
  },
};

export type CreateReceiptInvoiceResponse = {
  id: string;
  documentNumber: string;
  pdfUrl: string;
};

function sha256(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function receiptDateToDatabaseDate(value: string) {
  /**
   * Mittags UTC verhindert, dass sich das reine Belegdatum
   * durch Zeitzonenverschiebungen verändert.
   */
  const date = new Date(`${value}T12:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Ungültiges Belegdatum.');
  }

  return date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | CreateReceiptInvoiceResponse
    | {
        message: string;
      }
  >,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const session = await getServerSession(req);

  if (!session) {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  let temporaryPath: string | null = null;
  const uploadedPaths: string[] = [];

  try {
    const { fields, files } = await parseMultipartForm(req);

    const file = getUploadedFile(files, 'file');
    const reservationId = getStringField(fields, 'reservationId');
    const addressJson = getStringField(fields, 'billingAddress');
    const saveBillingAddress = getBooleanField(fields, 'saveBillingAddress');

    if (!file) {
      return res.status(400).json({
        message: 'Bitte lade einen Kassenbeleg hoch.',
      });
    }

    temporaryPath = file.filepath;

    if (!reservationId) {
      return res.status(400).json({
        message: 'Bitte wähle eine Reservierung aus.',
      });
    }

    if (!addressJson) {
      return res.status(400).json({
        message: 'Bitte gib eine Rechnungsadresse an.',
      });
    }

    let billingAddress: BillingAddressInput;

    try {
      billingAddress = JSON.parse(addressJson) as BillingAddressInput;
    } catch {
      return res.status(400).json({
        message: 'Die Rechnungsadresse ist ungültig.',
      });
    }

    if (!isCompleteBillingAddress(billingAddress)) {
      return res.status(400).json({
        message:
          'Firmenname, Straße, Postleitzahl, Ort und Land sind erforderlich.',
      });
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
      },
    });

    if (!reservation) {
      return res.status(404).json({
        message: 'Reservierung nicht gefunden.',
      });
    }

    const originalReceiptPdf = await fs.readFile(file.filepath);

    const receipt = await parseTebiReceiptPdf(originalReceiptPdf);

    const receiptDate = receiptDateToDatabaseDate(receipt.receiptDate);

    const existing = await prisma.receiptInvoiceSupplement.findUnique({
      where: {
        receiptNumber_receiptDate: {
          receiptNumber: receipt.receiptNumber,
          receiptDate,
        },
      },
      select: {
        id: true,
        documentNumber: true,
      },
    });

    if (existing) {
      return res.status(409).json({
        message: `Für den Kassenbeleg ${receipt.receiptNumber} wurde bereits das Dokument ${existing.documentNumber} erstellt.`,
      });
    }

    const year = receipt.receiptDate.slice(0, 4);

    const safeReceiptNumber = receipt.receiptNumber
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 50);

    if (!safeReceiptNumber) {
      throw new Error('Die Rechnungs-ID ist ungültig.');
    }

    const documentNumber = `KB-${year}-${safeReceiptNumber}`;

    const finalPdf = await createReceiptSupplementPdf({
      documentNumber,
      originalReceiptPdf,
      receipt,
      billingAddress,
      reservation,
    });

    const folder = ['receipt-invoices', year, documentNumber].join('/');

    const originalPdfPath = `${folder}/original.pdf`;
    const finalPdfPath = `${folder}/rechnung.pdf`;

    await uploadReceiptInvoicePdf({
      path: originalPdfPath,
      buffer: originalReceiptPdf,
    });

    uploadedPaths.push(originalPdfPath);

    await uploadReceiptInvoicePdf({
      path: finalPdfPath,
      buffer: finalPdf,
    });

    uploadedPaths.push(finalPdfPath);

    const record = await prisma.$transaction(async (transaction) => {
      if (saveBillingAddress) {
        await transaction.reservation.update({
          where: {
            id: reservation.id,
          },
          data: {
            billingAddress: billingAddress as unknown as Prisma.InputJsonValue,
          },
        });
      }

      return transaction.receiptInvoiceSupplement.create({
        data: {
          documentNumber,

          reservationId: reservation.id,

          receiptNumber: receipt.receiptNumber,
          receiptDate,
          tableNumber: receipt.tableNumber || reservation.tableNumber,

          receiptCreatedAtLabel: receipt.createdAtLabel,
          receiptPaidAtLabel: receipt.paidAtLabel,

          netCents: receipt.netCents,
          vatCents: receipt.vatCents,
          grossCents: receipt.grossCents,
          currency: receipt.currency,

          recipientCompany: billingAddress.company,
          recipientEmail: reservation.email,

          recipientAddress: billingAddress as unknown as Prisma.InputJsonValue,

          taxLines: receipt.taxLines as unknown as Prisma.InputJsonValue,

          payments: receipt.payments as unknown as Prisma.InputJsonValue,

          originalPdfPath,
          finalPdfPath,

          originalPdfSha256: sha256(originalReceiptPdf),

          finalPdfSha256: sha256(finalPdf),
        },
      });
    });

    return res.status(201).json({
      id: record.id,
      documentNumber: record.documentNumber,
      pdfUrl: `/api/backend/receiptInvoices/${record.id}/pdf`,
    });
  } catch (error) {
    console.error(error);

    if (uploadedPaths.length > 0) {
      await removeReceiptInvoiceFiles(uploadedPaths).catch(console.error);
    }

    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : 'Die Rechnung konnte nicht erstellt werden.',
    });
  } finally {
    if (temporaryPath) {
      await fs.unlink(temporaryPath).catch(() => undefined);
    }
  }
}
