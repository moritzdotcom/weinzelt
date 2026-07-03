import { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import fs from 'fs';
import path from 'path';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  const { occurrenceId } = req.query;
  if (typeof occurrenceId !== 'string')
    return res.status(401).json('Event required');

  if (req.method === 'GET') {
    await handleGET(req, res, occurrenceId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
) {
  const eventOccurrence = await prisma.specialEventOccurrence.findFirst({
    where: {
      id,
    },
    select: {
      startTime: true,
      eventDate: {
        select: {
          date: true,
        },
      },
      specialEvent: {
        select: {
          name: true,
        },
      },
      registrations: {
        where: {
          status: 'REGISTERED',
        },
        select: {
          name: true,
          personCount: true,
        },
        orderBy: {
          name: 'asc',
        },
      },
    },
  });

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

  const nameStr = eventOccurrence?.specialEvent.name || 'Gästeliste';
  const dateStr = eventOccurrence?.eventDate.date || '';
  const timeStr = eventOccurrence?.startTime || '';

  doc
    .fontSize(18)
    .text(`${nameStr} - ${dateStr} - ${timeStr}`, { align: 'center' });
  doc.moveDown(1);

  // Tabelle
  let tableTop = doc.y;
  const colWidths = [
    ((doc.page.width - 80) / 100) * 60,
    ((doc.page.width - 80) / 100) * 20,
    ((doc.page.width - 80) / 100) * 20,
  ];
  const headers = ['Name', 'Personen', 'Eingecheckt'];

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
  eventOccurrence?.registrations.forEach((r) => {
    let rowTop = tableTop + 20 + rowIndex * 25; // 25pt Zeilenhöhe
    rowIndex += 1;

    const values = [r.name, r.personCount.toString(), ''];

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

  doc.end();
}
