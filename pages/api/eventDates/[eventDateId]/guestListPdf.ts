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
    .text(`Gästeliste ${dateStr ? dateStr : ''}`, { align: 'center' });
  doc.moveDown(1);

  Object.entries(grouped)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([timeslot, list], timeslotIndex) => {
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
      let tableTop = doc.y;
      // const colWidths = [230, 80, 100, 90];
      const colWidths = [
        ((doc.page.width - 80) / 100) * 55,
        ((doc.page.width - 80) / 100) * 13,
        ((doc.page.width - 80) / 100) * 17,
        ((doc.page.width - 80) / 100) * 15,
      ];
      const headers = ['Name', 'Personen', 'Tischnummer', 'Eingecheckt'];

      // Header-Zeile zeichnen
      let x = 40;
      headers.forEach((text, i) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('black')
          .text(text, x + 4, tableTop, {
            width: colWidths[i],
            align: 'left',
          });
        x += colWidths[i];
      });

      let rowIndex = 0;
      list.forEach((r) => {
        let rowTop = tableTop + 20 + rowIndex * 25; // 25pt Zeilenhöhe
        rowIndex += 1;

        const values = [r.name, r.people.toString(), r.tableNumber || '', ''];

        // Horizontale Linie oben
        doc
          .moveTo(40, rowTop - 5)
          .lineTo(40 + colWidths.reduce((a, b) => a + b, 0), rowTop - 5)
          .strokeColor('#000000')
          .stroke();

        if (rowTop > doc.page.height - 40) {
          doc.addPage();
          tableTop = 40;
          rowTop = 60;
          rowIndex = 0;
        }

        let xPos = 40;
        values.forEach((text, i) => {
          doc
            .font('Helvetica')
            .fontSize(12)
            .fillColor('black')
            .text(text, xPos + 6, rowTop + 3, {
              width: colWidths[i] - 8,
              align: 'left',
            });

          xPos += colWidths[i];
        });
      });

      // horizontale Linie unter letzter Zeile
      const endY = doc.y + 18;
      doc
        .moveTo(40, endY)
        .lineTo(40 + colWidths.reduce((a, b) => a + b, 0), endY)
        .strokeColor('#000000')
        .stroke();

      doc.moveDown(4);
      if (timeslotIndex < Object.entries(grouped).length - 1) doc.addPage();
    });

  doc.end();
}
