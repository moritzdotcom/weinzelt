import fs from 'fs';
import path from 'path';
import PDFKitDocument from 'pdfkit';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

import type {
  BillingAddressInput,
  ParsedTebiReceipt,
  ReceiptInvoiceMode,
  ReceiptTaxLine,
} from './types';
import { formatCents, type ReceiptTotals } from './money';

const ISSUER = {
  name: 'Weinzelt GmbH',
  line1: 'Heesenstraße 74, Halle 7f',
  postalCode: '40549',
  city: 'Düsseldorf',
  country: 'Deutschland',
  vatId: 'DE454563716',
};

export type ReceiptPdfSource = {
  receipt: ParsedTebiReceipt;
  pdf: Buffer;
};

type ReservationSnapshot = {
  id: string;
  name: string;
  email: string;
  people: number;
  type: string;
  tableNumber: string | null;
} | null;

type CreateReceiptInvoiceDocumentPdfInput = {
  documentNumber: string;
  mode: ReceiptInvoiceMode;
  recipient: {
    email?: string | null;
    billingAddress: BillingAddressInput;
  };
  reservation: ReservationSnapshot;
  sources: ReceiptPdfSource[];
  totals: ReceiptTotals;
  splitRecipientIndex?: number;
  splitRecipientCount?: number;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
  }).format(date);
}

function addressLines(address: BillingAddressInput): string[] {
  return [
    address.company,
    address.contactName,
    address.line1,
    address.line2,
    [address.postalCode, address.city].filter(Boolean).join(' '),
    address.country,
  ].filter(Boolean) as string[];
}

function titleForMode(mode: ReceiptInvoiceMode): string {
  switch (mode) {
    case 'COLLECTION':
      return 'Sammelrechnung zu Kassenbelegen';
    case 'SPLIT':
      return 'Teilrechnung zu einem Kassenbeleg';
    default:
      return 'Berichtigte Rechnung zum Kassenbeleg';
  }
}

function subtitleForMode(mode: ReceiptInvoiceMode): string {
  switch (mode) {
    case 'COLLECTION':
      return 'Zusammenfassung mehrerer bereits vollständig bezahlter Kassenvorgänge';
    case 'SPLIT':
      return 'Abgegrenzter Anteil eines bereits vollständig bezahlten Kassenvorgangs';
    default:
      return 'Rechnungsergänzung zu einem bereits vollständig bezahlten Kassenvorgang';
  }
}

function noticeForMode(
  mode: ReceiptInvoiceMode,
  sourceNumbers: string[],
): string {
  const sourceLabel =
    sourceNumbers.length === 1
      ? `den beigefügten Kassenbeleg mit der Rechnungs-ID ${sourceNumbers[0]}`
      : `die beigefügten Kassenbelege mit den Rechnungs-IDs ${sourceNumbers.join(
          ', ',
        )}`;

  if (mode === 'SPLIT') {
    return [
      `Dieses Dokument ergänzt ${sourceLabel}.`,
      'Der beigefügte Originalbeleg weist den vollständigen Kassenvorgang aus.',
      'Diese Teilrechnung betrifft ausschließlich den auf dieser Seite ausgewiesenen Anteil.',
      'Sie dokumentiert keinen neuen Geschäftsvorfall und begründet keine erneute Zahlungsverpflichtung.',
      'Der ausgewiesene Teilbetrag wurde bereits vollständig bezahlt.',
    ].join(' ');
  }

  return [
    `Dieses Dokument ergänzt ${sourceLabel}.`,
    'Es dokumentiert keinen neuen Geschäftsvorfall und begründet keine erneute Zahlungsverpflichtung.',
    'Der ausgewiesene Rechnungsbetrag wurde bereits vollständig bezahlt.',
    'Die Leistungspositionen ergeben sich aus den beigefügten Original-Kassenbelegen.',
  ].join(' ');
}

function createCoverPdf({
  documentNumber,
  mode,
  recipient,
  reservation,
  sources,
  totals,
  splitRecipientIndex,
  splitRecipientCount,
}: CreateReceiptInvoiceDocumentPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFKitDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `${titleForMode(mode)} ${documentNumber}`,
        Author: ISSUER.name,
      },
    });

    const chunks: Buffer[] = [];

    document.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    document.on('error', reject);

    document.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    const pageWidth = document.page.width;
    const pageHeight = document.page.height;
    const left = 40;
    const right = pageWidth - 40;
    const contentWidth = right - left;

    const drawHeader = () => {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');

      if (fs.existsSync(logoPath)) {
        try {
          document.image(logoPath, left, 38, {
            fit: [170, 72],
          });
        } catch (error) {
          console.warn('Logo konnte nicht eingebunden werden:', error);
        }
      }

      document
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#555555')
        .text(
          [
            ISSUER.name,
            ISSUER.line1,
            `${ISSUER.postalCode} ${ISSUER.city}`,
            `USt-IdNr.: ${ISSUER.vatId}`,
          ].join('\n'),
          pageWidth - 245,
          42,
          {
            width: 197,
            align: 'right',
          },
        );

      document
        .moveTo(left, 100)
        .lineTo(right, 100)
        .strokeColor('#D6D6D6')
        .stroke();
    };

    const drawFooter = () => {
      document
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#777777')
        .text(
          `${ISSUER.name} · ${ISSUER.line1} · ${ISSUER.postalCode} ${ISSUER.city} · USt-IdNr. ${ISSUER.vatId}`,
          left,
          pageHeight - 60,
          {
            width: contentWidth,
            align: 'center',
          },
        );
    };

    drawHeader();

    let y = 125;

    document
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#111111')
      .text(titleForMode(mode), left, y);

    y += 27;

    document
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555555')
      .text(subtitleForMode(mode), left, y);

    y += 35;

    const metadata: Array<[string, string]> = [
      ['Dokumentnummer', documentNumber],
      ['Rechnungsdatum', formatDate(new Date())],
      [
        'Originalbeleg(e)',
        sources.map(({ receipt }) => receipt.receiptNumber).join(', '),
      ],
    ];

    if (
      mode === 'SPLIT' &&
      splitRecipientIndex !== undefined &&
      splitRecipientCount !== undefined
    ) {
      metadata.push([
        'Teilrechnung',
        `${splitRecipientIndex + 1} von ${splitRecipientCount}`,
      ]);
    }

    if (reservation) {
      metadata.push(
        ['Reservierung', reservation.name],
        ['Reservierungs-ID', reservation.id],
      );
    }

    const metaLabelWidth = 130;

    for (const [label, value] of metadata) {
      document
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#666666')
        .text(label, left, y, {
          width: metaLabelWidth,
        });

      document
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text(value, left + metaLabelWidth, y, {
          width: contentWidth - metaLabelWidth,
        });

      y += 17;
    }

    y += 17;

    document
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111111')
      .text('Rechnungsempfänger', left, y);

    if (reservation) {
      document.text('Reservierung', left + 300, y);
    }

    y += 19;

    const recipientY = y;

    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#222222')
      .text(
        [...addressLines(recipient.billingAddress), recipient.email || '']
          .filter(Boolean)
          .join('\n'),
        left,
        recipientY,
        {
          width: 250,
          lineGap: 2,
        },
      );

    if (reservation) {
      document.text(
        [
          reservation.name,
          reservation.email,
          `${reservation.people} Personen`,
          reservation.type,
          reservation.tableNumber ? `Tisch ${reservation.tableNumber}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        left + 300,
        recipientY,
        {
          width: 205,
          lineGap: 2,
        },
      );
    }

    y = recipientY + 98;

    document.moveTo(left, y).lineTo(right, y).strokeColor('#D6D6D6').stroke();

    y += 16;

    document
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111111')
      .text(
        sources.length === 1 ? 'Kassenbeleg' : 'Enthaltene Kassenbelege',
        left,
        y,
      );

    y += 22;

    const columns = {
      number: left,
      date: left + 100,
      table: left + 205,
      net: left + 285,
      vat: left + 365,
      gross: left + 445,
    };

    const drawReceiptTableHeader = () => {
      document.font('Helvetica-Bold').fontSize(8).fillColor('#555555');

      document.text('Beleg', columns.number, y);
      document.text('Datum', columns.date, y);
      document.text('Tisch', columns.table, y);
      document.text('Netto', columns.net, y, {
        width: 72,
        align: 'right',
      });
      document.text('MwSt.', columns.vat, y, {
        width: 72,
        align: 'right',
      });
      document.text('Gesamt', columns.gross, y, {
        width: 72,
        align: 'right',
      });

      y += 14;

      document.moveTo(left, y).lineTo(right, y).strokeColor('#D6D6D6').stroke();

      y += 8;
    };

    drawReceiptTableHeader();

    for (const { receipt } of sources) {
      if (y > 690) {
        drawFooter();
        document.addPage();
        drawHeader();
        y = 150;

        document
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('#111111')
          .text('Fortsetzung: Enthaltene Kassenbelege', left, y);

        y += 26;
        drawReceiptTableHeader();
      }

      document.font('Helvetica').fontSize(8.5).fillColor('#222222');

      document.text(receipt.receiptNumber, columns.number, y, { width: 95 });

      document.text(
        receipt.receiptDate.split('-').reverse().join('.'),
        columns.date,
        y,
        { width: 100 },
      );

      document.text(receipt.tableNumber || '—', columns.table, y, {
        width: 70,
      });

      document.text(formatCents(receipt.netCents), columns.net, y, {
        width: 72,
        align: 'right',
      });

      document.text(formatCents(receipt.vatCents), columns.vat, y, {
        width: 72,
        align: 'right',
      });

      document.text(formatCents(receipt.grossCents), columns.gross, y, {
        width: 72,
        align: 'right',
      });

      y += 18;
    }

    y += 10;

    if (y > 620) {
      drawFooter();
      document.addPage();
      drawHeader();
      y = 150;
    }

    document.moveTo(left, y).lineTo(right, y).strokeColor('#D6D6D6').stroke();

    y += 16;

    document
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111111')
      .text('Beträge', left, y);

    y += 24;

    const drawAmountRow = (
      label: string,
      amountCents: number,
      bold = false,
    ) => {
      document
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(10)
        .fillColor('#222222')
        .text(label, left, y, {
          width: 330,
        });

      document.text(formatCents(amountCents), left + 330, y, {
        width: contentWidth - 330,
        align: 'right',
      });

      y += 19;
    };

    drawAmountRow('Nettobetrag', totals.netCents);

    for (const taxLine of totals.taxLines) {
      drawAmountRow(
        `${taxLine.rate.toLocaleString('de-DE')} % Umsatzsteuer`,
        taxLine.taxCents,
      );
    }

    drawAmountRow('Zwischensumme', totals.subtotalCents, true);

    if (totals.tipCents > 0) {
      drawAmountRow('Trinkgeld', totals.tipCents);
    }

    drawAmountRow(
      mode === 'SPLIT' ? 'Teilbetrag' : 'Gesamtbetrag',
      totals.grossCents,
      true,
    );

    drawAmountRow('Bereits bezahlt', totals.grossCents);

    drawAmountRow('Offener Rechnungsbetrag', 0, true);

    y += 8;

    const noticeHeight = 94;

    if (y + noticeHeight > pageHeight - 60) {
      drawFooter();
      document.addPage();
      drawHeader();
      y = 150;
    }

    document
      .roundedRect(left, y, contentWidth, noticeHeight, 7)
      .fillAndStroke('#F7F7F7', '#DDDDDD');

    document
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor('#111111')
      .text('Hinweis', left + 14, y + 13);

    document
      .font('Helvetica')
      .fontSize(8.6)
      .fillColor('#333333')
      .text(
        noticeForMode(
          mode,
          sources.map(({ receipt }) => receipt.receiptNumber),
        ),
        left + 14,
        y + 31,
        {
          width: contentWidth - 28,
          lineGap: 2,
        },
      );

    drawFooter();
    document.end();
  });
}

export async function createReceiptInvoiceDocumentPdf(
  input: CreateReceiptInvoiceDocumentPdfInput,
): Promise<Buffer> {
  const cover = await createCoverPdf(input);

  const result = await PDFLibDocument.create();

  const coverPdf = await PDFLibDocument.load(cover);

  const coverPages = await result.copyPages(
    coverPdf,
    coverPdf.getPageIndices(),
  );

  for (const page of coverPages) {
    result.addPage(page);
  }

  for (const source of input.sources) {
    const original = await PDFLibDocument.load(source.pdf);

    const pages = await result.copyPages(original, original.getPageIndices());

    for (const page of pages) {
      result.addPage(page);
    }
  }

  const bytes = await result.save();

  return Buffer.from(bytes);
}
