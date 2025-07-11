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
      type: true,
      payed: true,
      name: true,
      people: true,
      tableNumber: true,
      packageName: true,
      packagePrice: true,
      foodCountMeat: true,
      foodCountVegetarian: true,
      totalFoodPrice: true,
      internalNotes: true,
      seating: {
        select: {
          timeslot: true,
          eventDate: { select: { date: true } },
          availableStanding: true,
          availableVip: true,
        },
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
    .forEach(([timeslot, list], timeslotIndex) => {
      doc.text('', 40);
      doc
        .fontSize(14)
        .fillColor('black')
        .text(`Timeslot: ${timeslot}`, { underline: true });
      doc.moveUp(1);
      doc
        .fontSize(9)
        .fillColor('black')
        .text(
          `VIP: ${list.filter((r) => r.type == 'VIP').length} / ${
            list[0]?.seating.availableVip
          }   ST: ${list.filter((r) => r.type == 'STANDING').length} / ${
            list[0]?.seating.availableStanding
          }`,
          { align: 'right' }
        );
      doc.moveDown(1.5);

      // Tabelle
      const colWidths = [
        ((doc.page.width - 80) / 48) * 2,
        ((doc.page.width - 80) / 48) * 30,
        ((doc.page.width - 80) / 48) * 8,
        ((doc.page.width - 80) / 48) * 8,
      ];
      const headers = ['', 'Name', 'Personen', 'Tischnummer'];

      // Header-Zeile
      let x = 40;
      let tableTop = doc.y;
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

      let rowIndex = 0;
      let extraRowHeights = 0;
      list
        .sort((a, b) =>
          (a.tableNumber || '').localeCompare(b.tableNumber || '')
        )
        .forEach((r) => {
          let rowTop = tableTop + 20 + rowIndex * 38 + extraRowHeights; // 35pt Zeilenhöhe
          rowIndex += 1;

          if (rowTop > doc.page.height - 80) {
            doc.addPage();
            tableTop = 40;
            rowTop = 60;
            rowIndex = 1;
            extraRowHeights = 0; // Reset für neue Seite
          }

          // Erste Zeile: Name | Personen | Tischnummer
          let xPos = 40;
          const values = [
            r.type == 'VIP' ? 'VIP' : 'ST',
            `${r.name} (${r.payed ? 'bezahlt' : 'offen'})`,
            r.people.toString(),
            r.tableNumber || '',
          ];
          values.forEach((text, i) => {
            doc
              .font('Helvetica')
              .fontSize(i == 0 ? 8 : 12)
              .fillColor('black')
              .text(text, xPos + 4, rowTop, {
                width: colWidths[i] - 8,
                align: 'left',
              });
            xPos += colWidths[i];
          });

          // Zweite Zeile: PackageName (PackagePrice €), eingerückt unter Name-Spalte
          const pkgText = `${r.packageName} (${r.packagePrice} €)`;
          const foodText =
            r.totalFoodPrice > 0
              ? ` | ${r.foodCountMeat} x Fleisch, ${r.foodCountVegetarian} x Vegetarisch (${r.totalFoodPrice} €)`
              : '';
          doc
            .font('Helvetica-Oblique')
            .fontSize(11)
            .fillColor('gray')
            .text(`${pkgText}${foodText}`, 65, rowTop + 16, {
              // 10pt Einzug, 16pt unter der ersten Zeile
              width: colWidths[0] + colWidths[1] + colWidths[2] - 20,
              align: 'left',
            });

          if (r.internalNotes) {
            extraRowHeights += 16; // Zusätzliche Höhe für interne Notizen
            // Interne Notizen, eingerückt unter Package-Text
            doc
              .font('Helvetica-Oblique')
              .fontSize(11)
              .fillColor('gray')
              .text(`Interne Notiz: ${r.internalNotes}`, 42, rowTop + 32, {
                // 10pt Einzug, 32pt unter der ersten Zeile
                width: colWidths[0] + colWidths[1] + colWidths[2] - 20,
                align: 'left',
              });
          }
          const rowHeight = r.internalNotes ? 48 : 32;
          // Horizontale Linie unterhalb beider Zeilen
          doc
            .moveTo(40, rowTop + rowHeight)
            .lineTo(
              40 + colWidths.reduce((a, b) => a + b, 0),
              rowTop + rowHeight
            )
            .strokeColor('#000000')
            .stroke();
        });

      // Nach der Liste ausreichend Abstand einfügen
      doc.moveDown(3);
      if (timeslotIndex < Object.entries(grouped).length - 1) doc.addPage();
    });

  doc.end();
}
