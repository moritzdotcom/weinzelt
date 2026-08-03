import fs from 'fs';
import path from 'path';
import PDFKitDocument from 'pdfkit';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

import type { BillingAddressInput, ParsedTebiReceipt } from './types';

const ISSUER = {
  name: 'Weinzelt GmbH',
  line1: 'Heesenstraße 74, Halle 7f',
  postalCode: '40549',
  city: 'Düsseldorf',
  country: 'Deutschland',
  vatId: 'DE454563716',
};

function formatCents(cents: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
  }).format(date);
}

function addressLines(address: BillingAddressInput) {
  return [
    address.company,
    address.contactName,
    address.line1,
    address.line2,
    [address.postalCode, address.city].filter(Boolean).join(' '),
    address.country,
  ].filter(Boolean) as string[];
}

function createCoverPage({
  documentNumber,
  receipt,
  billingAddress,
  reservation,
}: {
  documentNumber: string;
  receipt: ParsedTebiReceipt;
  billingAddress: BillingAddressInput;
  reservation: {
    id: string;
    name: string;
    email: string;
    people: number;
    type: string;
    tableNumber: string | null;
  };
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFKitDocument({
      size: 'A4',
      margin: 48,
      info: {
        Title: `Berichtigte Rechnung ${documentNumber}`,
        Author: ISSUER.name,
        Subject: `Rechnungsergänzung zum Kassenbeleg ${receipt.receiptNumber}`,
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
    const contentWidth =
      pageWidth - document.page.margins.left - document.page.margins.right;

    const logoPath = path.join(process.cwd(), 'public', 'logo.png');

    if (fs.existsSync(logoPath)) {
      try {
        document.image(logoPath, 48, 40, {
          fit: [170, 75],
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
        pageWidth - 240,
        42,
        {
          width: 190,
          align: 'right',
        },
      );

    document
      .moveTo(48, 100)
      .lineTo(pageWidth - 48, 100)
      .strokeColor('#D6D6D6')
      .stroke();

    document
      .font('Helvetica-Bold')
      .fontSize(19)
      .fillColor('#111111')
      .text('Berichtigte Rechnung zum Kassenbeleg', 48, 115);

    document
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555555')
      .text(
        'Rechnungsergänzung zu einem bereits vollständig bezahlten Kassenvorgang',
        48,
        140,
      );

    const metaTop = 160;
    const metaLabelWidth = 135;

    const metadata = [
      ['Dokumentnummer', documentNumber],
      ['Originalbeleg', receipt.receiptNumber],
      ['Belegdatum', receipt.createdAtLabel],
      ['Rechnungsdatum', formatDate(new Date())],
      ['Reservierung', reservation.name],
      ['Reservierungs-ID', reservation.id],
      [
        'Tisch',
        receipt.tableNumber || reservation.tableNumber || 'Nicht angegeben',
      ],
    ];

    let metaY = metaTop;

    for (const [label, value] of metadata) {
      document
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#666666')
        .text(label, 48, metaY, {
          width: metaLabelWidth,
        });

      document
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text(value, 48 + metaLabelWidth, metaY, {
          width: contentWidth - metaLabelWidth,
        });

      metaY += 17;
    }

    const recipientTop = metaY + 18;

    document
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111111')
      .text('Rechnungsempfänger', 48, recipientTop);

    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#222222')
      .text(addressLines(billingAddress).join('\n'), 48, recipientTop + 19, {
        lineGap: 2,
        width: 250,
      });

    document
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111111')
      .text('Reservierung', 340, recipientTop);

    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#222222')
      .text(
        [
          reservation.name,
          reservation.email,
          `${reservation.people} Personen`,
          reservation.type,
        ].join('\n'),
        340,
        recipientTop + 19,
        {
          lineGap: 2,
          width: 205,
        },
      );

    const tableTop = recipientTop + 120;

    document
      .moveTo(48, tableTop - 12)
      .lineTo(pageWidth - 48, tableTop - 12)
      .strokeColor('#D6D6D6')
      .stroke();

    document
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111111')
      .text('Beträge des ursprünglichen Kassenbelegs', 48, tableTop);

    let rowY = tableTop + 25;

    const drawAmountRow = ({
      label,
      amount,
      bold = false,
    }: {
      label: string;
      amount: string;
      bold?: boolean;
    }) => {
      document
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(10)
        .fillColor('#222222')
        .text(label, 48, rowY, {
          width: 320,
        });

      document.text(amount, 368, rowY, {
        width: contentWidth - 320,
        align: 'right',
      });

      rowY += 20;
    };

    drawAmountRow({
      label: 'Nettobetrag',
      amount: formatCents(receipt.netCents),
    });

    for (const taxLine of receipt.taxLines) {
      drawAmountRow({
        label: `${taxLine.rate.toLocaleString('de-DE')} % Umsatzsteuer`,
        amount: formatCents(taxLine.taxCents),
      });
    }

    drawAmountRow({
      label: 'Zwischensumme',
      amount: formatCents(receipt.subtotalCents),
      bold: true,
    });

    if (receipt.tipCents > 0) {
      drawAmountRow({
        label: 'Trinkgeld',
        amount: formatCents(receipt.tipCents),
      });
    }

    drawAmountRow({
      label: 'Gesamtbetrag',
      amount: formatCents(receipt.grossCents),
      bold: true,
    });

    drawAmountRow({
      label: 'Bereits bezahlt',
      amount: formatCents(receipt.grossCents),
    });

    drawAmountRow({
      label: 'Offener Rechnungsbetrag',
      amount: formatCents(0),
      bold: true,
    });

    if (receipt.payments.length > 0) {
      rowY += 8;

      document
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Zahlungsübersicht', 48, rowY);

      rowY += 20;

      for (const payment of receipt.payments) {
        drawAmountRow({
          label: payment.label,
          amount: formatCents(payment.amountCents),
        });
      }
    }

    const noticeTop = rowY + 10;

    document
      .roundedRect(48, noticeTop, contentWidth, 92, 7)
      .fillAndStroke('#F7F7F7', '#DDDDDD');

    document
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor('#111111')
      .text('Hinweis', 62, noticeTop + 13);

    document
      .font('Helvetica')
      .fontSize(8.7)
      .fillColor('#333333')
      .text(
        [
          `Diese Rechnung berichtigt und ergänzt den beigefügten Kassenbeleg mit der Rechnungs-ID ${receipt.receiptNumber}.`,
          'Sie dokumentiert keinen neuen Geschäftsvorfall und begründet keine erneute Zahlungsverpflichtung.',
          'Der Rechnungsbetrag wurde bereits vollständig bezahlt.',
          'Die Leistungspositionen ergeben sich aus dem beigefügten Original-Kassenbeleg auf den folgenden Seiten.',
        ].join(' '),
        62,
        noticeTop + 31,
        {
          width: contentWidth - 28,
          lineGap: 2,
        },
      );

    document
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#777777')
      .text(
        `${ISSUER.name} · ${ISSUER.line1} · ${ISSUER.postalCode} ${ISSUER.city} · USt-IdNr. ${ISSUER.vatId}`,
        48,
        document.page.height - 60,
        {
          width: contentWidth,
          align: 'center',
        },
      );

    document.end();
  });
}

export async function createReceiptSupplementPdf({
  documentNumber,
  originalReceiptPdf,
  receipt,
  billingAddress,
  reservation,
}: {
  documentNumber: string;
  originalReceiptPdf: Buffer;
  receipt: ParsedTebiReceipt;
  billingAddress: BillingAddressInput;
  reservation: {
    id: string;
    name: string;
    email: string;
    people: number;
    type: string;
    tableNumber: string | null;
  };
}): Promise<Buffer> {
  const coverPage = await createCoverPage({
    documentNumber,
    receipt,
    billingAddress,
    reservation,
  });

  const resultPdf = await PDFLibDocument.create();

  const coverPdfDocument = await PDFLibDocument.load(coverPage);
  const originalPdfDocument = await PDFLibDocument.load(originalReceiptPdf);

  const coverPages = await resultPdf.copyPages(
    coverPdfDocument,
    coverPdfDocument.getPageIndices(),
  );

  for (const page of coverPages) {
    resultPdf.addPage(page);
  }

  const originalPages = await resultPdf.copyPages(
    originalPdfDocument,
    originalPdfDocument.getPageIndices(),
  );

  for (const page of originalPages) {
    resultPdf.addPage(page);
  }

  const result = await resultPdf.save();

  return Buffer.from(result);
}
