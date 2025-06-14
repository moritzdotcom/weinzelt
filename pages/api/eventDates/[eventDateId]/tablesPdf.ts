import { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import fs from 'fs';
import path from 'path';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  const { eventDateId } = req.query;
  if (typeof eventDateId !== 'string')
    return res.status(401).json('Event required');

  if (req.method === 'GET') {
    await handleGET(req, res, eventDateId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const reservations = await prisma.reservation.findMany({
    where: { seating: { eventDateId: id }, confirmationState: 'ACCEPTED' },
    select: {
      name: true,
      people: true,
      tableNumber: true,
      packageName: true,
      packagePrice: true,
      seating: {
        select: { timeslot: true, eventDate: { select: { date: true } } },
      },
    },
  });

  // Gruppiere nach timeslot
  const grouped = reservations.reduce((acc, res) => {
    const slot = res.seating.timeslot;
    if (!acc[slot]) acc[slot] = [];
    acc[slot].push(res);
    return acc;
  }, {} as Record<string, typeof reservations>);

  const doc = new PDFDocument({ margin: 40 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=gaesteliste.pdf');
  doc.pipe(res);

  // Logo
  const logoPath = path.resolve('./public/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, doc.page.width / 2 - 100, 20, { width: 200 });
  }
  doc.moveDown(4);

  const dateStr = reservations[0]?.seating.eventDate?.date;

  doc
    .fontSize(18)
    .text(`Tischbelegung ${dateStr ? dateStr : ''}`, { align: 'center' });
  doc.moveDown(1);

  Object.entries(grouped)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([timeslot, list]) => {
      // Sortiere innerhalb des Timeslots nach Tischnummer
      list.sort((a, b) =>
        (a.tableNumber || '').localeCompare(b.tableNumber || '')
      );

      doc.text('', 40);
      doc
        .fontSize(14)
        .fillColor('black')
        .text(`Timeslot: ${timeslot}`, { underline: true });
      doc.moveDown(0.5);

      // Tabelle
      const colWidths = [
        ((doc.page.width - 80) / 12) * 8,
        ((doc.page.width - 80) / 12) * 2,
        ((doc.page.width - 80) / 12) * 2,
      ];
      const headers = ['Name', 'Personen', 'Tischnummer'];

      // Header-Zeile
      let x = 40;
      const tableTop = doc.y;
      headers.forEach((text, i) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('black')
          .text(text, x + 4, tableTop, {
            width: colWidths[i] - 8,
            align: 'left',
          });
        x += colWidths[i];
      });
      doc.moveDown(1);

      // Horizontale Linie oben
      doc
        .moveTo(40, tableTop + 14)
        .lineTo(doc.page.width - 40, tableTop + 14)
        .strokeColor('#000000')
        .stroke();

      // Zeilen pro Gast doppelt zeichnen
      list.forEach((r, idx) => {
        const rowTop = tableTop + 20 + idx * 38; // 35pt Zeilenhöhe

        // Erste Zeile: Name | Personen | Tischnummer
        let xPos = 40;
        const values = [r.name, r.people.toString(), r.tableNumber || ''];
        values.forEach((text, i) => {
          doc
            .font('Helvetica')
            .fontSize(12)
            .fillColor('black')
            .text(text, xPos + 4, rowTop, {
              width: colWidths[i] - 8,
              align: 'left',
            });
          xPos += colWidths[i];
        });

        // Zweite Zeile: PackageName (PackagePrice €), eingerückt unter Name-Spalte
        const pkgText = `${r.packageName} (${r.packagePrice} €)`;
        doc
          .font('Helvetica-Oblique')
          .fontSize(11)
          .fillColor('gray')
          .text(pkgText, 50, rowTop + 16, {
            // 10pt Einzug, 16pt unter der ersten Zeile
            width: colWidths[0] + colWidths[1] + colWidths[2] - 20,
            align: 'left',
          });

        // Horizontale Linie unterhalb beider Zeilen
        doc
          .moveTo(40, rowTop + 32)
          .lineTo(40 + colWidths.reduce((a, b) => a + b, 0), rowTop + 32)
          .strokeColor('#000000')
          .stroke();
      });

      // Nach der Liste ausreichend Abstand einfügen
      doc.moveDown(3);
    });

  doc.end();
}
