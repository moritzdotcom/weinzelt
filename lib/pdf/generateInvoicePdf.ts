import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { formatAddressLines } from '../mailer/helpers/address';

type Address = any; // du hast bereits Address Typen – kannst du hier ersetzen

type InvoiceLineItem = {
  name: string;
  qty: number;
  unitCents: number;
  vatRate: 7 | 19 | 0;
  totalCents: number;
};

function centsToEUR(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

function formatDate(d: Date) {
  return d.toLocaleDateString('de-DE');
}

export async function generateInvoicePDF(opts: {
  invoiceNumber: string;
  issuedAt: Date;
  customerName: string;
  customerEmail: string;
  billingAddress?: Address | null;
  eventDateLabel: string; // z.B. "12.07.2026"
  timeslot: string; // z.B. "18:00 - 22:00"
  lineItems: InvoiceLineItem[];
  vat7Cents: number;
  vat19Cents: number;
  totalCents: number;
}) {
  const doc = new PDFDocument({ margin: 48, size: 'A4' });

  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // Logo (optional)
  const logoPath = path.resolve('./public/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 48, 40, { width: 140 });
  }

  // Header right
  doc
    .fontSize(10)
    .fillColor('#111')
    .text('Weinzelt GmbH', 0, 44, { align: 'right' })
    .text('Düsseldorf', { align: 'right' })
    .moveDown(0.2)
    .text(`Rechnung: ${opts.invoiceNumber}`, { align: 'right' })
    .text(`Datum: ${formatDate(opts.issuedAt)}`, { align: 'right' });

  doc.moveDown(3);

  // Recipient
  doc
    .fontSize(11)
    .fillColor('#111')
    .text('Rechnung an:', 48)
    .moveDown(0.4)
    .font('Helvetica-Bold')
    .text(opts.customerName)
    .font('Helvetica')
    .text(opts.customerEmail);

  // Optional billing address (wenn du willst)
  if (opts.billingAddress) {
    if (opts.billingAddress) {
      doc
        .fontSize(10)
        .fillColor('#555')
        .moveDown(0.2)
        .text('Rechnungsadresse:', 48);

      // doc.fillColor('#333');

      const addressLines = formatAddressLines(opts.billingAddress);

      addressLines.forEach((line) => {
        doc.text(line, 48, doc.y, {
          width: 250,
        });
      });
    }
  }

  doc.moveDown(1.5);

  // Title + service description
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor('#111')
    .text('Rechnung', 48);

  doc.moveDown(0.6);

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#333')
    .text(
      `Leistung: Reservierung Weinzelt · ${opts.eventDateLabel} · ${opts.timeslot}`,
      48,
    );

  doc.moveDown(1.2);

  const tableLeft = 48;
  const tableRight = doc.page.width - 48;

  const columns = {
    qty: 60,
    vat: 60,
    unit: 100,
    total: 100,
  };

  // automatisch berechnet
  const col = {
    total: tableRight - columns.total,
    unit: tableRight - columns.total - columns.unit,
    vat: tableRight - columns.total - columns.unit - columns.vat,
    qty: tableRight - columns.total - columns.unit - columns.vat - columns.qty,
    name: tableLeft,
  };

  // dynamische Name-Breite
  const nameWidth = col.qty - col.name - 8;

  const y0 = doc.y;

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#111')
    .text('Position', col.name, y0, { width: nameWidth })
    .text('Menge', col.qty, y0, {
      width: columns.qty,
      align: 'right',
    })
    .text('MwSt', col.vat, y0, {
      width: columns.vat,
      align: 'right',
    })
    .text('Einzel', col.unit, y0, {
      width: columns.unit,
      align: 'right',
    })
    .text('Summe', col.total, y0, {
      width: columns.total,
      align: 'right',
    });

  doc
    .moveTo(tableLeft, y0 + 16)
    .lineTo(tableRight, y0 + 16)
    .strokeColor('#111')
    .stroke();

  doc.moveDown(0.8);

  // Rows
  doc.font('Helvetica').fontSize(10).fillColor('#111');

  opts.lineItems.forEach((li) => {
    const y = doc.y;

    doc.text(li.name, col.name, y, {
      width: nameWidth,
    });

    doc.text(String(li.qty), col.qty, y, {
      width: columns.qty,
      align: 'right',
    });

    doc.text(`${li.vatRate}%`, col.vat, y, {
      width: columns.vat,
      align: 'right',
    });

    doc.text(centsToEUR(li.unitCents), col.unit, y, {
      width: columns.unit,
      align: 'right',
    });

    doc.text(centsToEUR(li.totalCents), col.total, y, {
      width: columns.total,
      align: 'right',
    });

    doc.moveDown(0.6);
  });

  doc
    .moveTo(tableLeft, doc.y + 6)
    .lineTo(tableRight, doc.y + 6)
    .strokeColor('#ddd')
    .stroke();

  doc.moveDown(1.2);

  // Totals block
  const totalsLeft = tableRight - 260;
  if (opts.vat7Cents > 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#111')
      .text(`MwSt 7%: ${centsToEUR(opts.vat7Cents)}`, totalsLeft, doc.y, {
        width: 260,
        align: 'right',
      })
      .moveDown(0.4);
  }
  if (opts.vat19Cents > 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#111')
      .text(`MwSt 19%: ${centsToEUR(opts.vat19Cents)}`, totalsLeft, doc.y, {
        width: 260,
        align: 'right',
      });
  }

  doc.moveDown(0.4);

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(`Gesamt: ${centsToEUR(opts.totalCents)}`, totalsLeft, doc.y, {
      width: 260,
      align: 'right',
    });

  doc.moveDown(0.8);

  // leichte Box-Optik
  const noteX = 48;
  const noteW = tableRight - 48;
  const noteY = doc.y;
  const padding = 10;

  const noteText1 = 'Hinweis: Das Verzehrguthaben ist ein Mehrzweckgutschein.';
  const noteText2 =
    'Die Umsatzsteuer entsteht erst bei Einlösung vor Ort und wird dann auf dem Kassenbeleg ausgewiesen.';

  // Hintergrund/Border (dezenter)
  doc
    .save()
    .rect(noteX, noteY, noteW, 40)
    .fillColor('#f5f5f5')
    .fill()
    .restore();

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#333')
    .text(noteText1, noteX + padding, noteY + padding, {
      width: noteW - padding * 2,
      align: 'left',
    })
    .text(noteText2, noteX + padding, noteY + padding + 13, {
      width: noteW - padding * 2,
      align: 'left',
    });

  // Cursor unter die Box setzen
  doc.y = noteY + 40;

  doc.moveDown(2);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#555')
    .text(
      'Vielen Dank! Dies ist eine maschinell erstellte Rechnung und ohne Unterschrift gültig.',
      48,
      doc.y,
      { width: tableRight - 48 },
    );

  doc.end();
  return done;
}
