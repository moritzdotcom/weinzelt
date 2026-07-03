import { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import fs from 'fs';
import path from 'path';

const PAGE_MARGIN = 40;
const ROW_MIN_HEIGHT = 28;
const TABLE_HEADER_HEIGHT = 26;

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: `The HTTP ${req.method} method is not supported at this route.`,
    });
  }

  const { specialEventId, occurrenceId } = req.query;

  if (typeof specialEventId !== 'string') {
    return res.status(400).json({ error: 'Special event required' });
  }

  if (typeof occurrenceId !== 'string') {
    return res.status(400).json({ error: 'Occurrence required' });
  }

  return handleGET(req, res, specialEventId, occurrenceId);
}

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  specialEventId: string,
  occurrenceId: string,
) {
  const eventOccurrence = await prisma.specialEventOccurrence.findFirst({
    where: {
      id: occurrenceId,
      specialEventId,
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

  if (!eventOccurrence) {
    return res.status(404).json({
      error: 'Event occurrence not found',
    });
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=gaesteliste.pdf');

  doc.pipe(res);

  const tableWidth = doc.page.width - PAGE_MARGIN * 2;

  const colWidths = [tableWidth * 0.6, tableWidth * 0.2, tableWidth * 0.2];

  const title = eventOccurrence.specialEvent.name || 'Gästeliste';
  const date = formatDate(eventOccurrence.eventDate.date);
  const time = formatTime(eventOccurrence.startTime);

  drawLogo(doc);

  doc
    .moveDown(4)
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor('black')
    .text(title, {
      align: 'center',
    });

  doc
    .moveDown(0.4)
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#555555')
    .text([date, time].filter(Boolean).join(' · '), {
      align: 'center',
    });

  doc.moveDown(1.5);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#555555')
    .text(`${eventOccurrence.registrations.length} Reservierungen`, {
      align: 'right',
    });

  let y = doc.y + 12;

  y = drawTableHeader(doc, y, colWidths);

  for (const registration of eventOccurrence.registrations) {
    const values = [
      registration.name || '-',
      registration.personCount.toString(),
      '',
    ];

    const rowHeight = getRowHeight(doc, values, colWidths);

    if (y + rowHeight > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
      y = drawTableHeader(doc, y, colWidths);
    }

    y = drawTableRow(doc, y, values, colWidths, rowHeight);
  }

  drawTableBottomLine(doc, y, tableWidth);

  doc.end();
}

function drawLogo(doc: PDFKit.PDFDocument) {
  const logoPath = path.resolve(process.cwd(), 'public', 'logo.png');

  if (!fs.existsSync(logoPath)) return;

  try {
    doc.image(logoPath, doc.page.width / 2 - 100, 20, {
      width: 200,
    });
  } catch (error) {
    console.error('[guestListPdf] Could not render logo:', error);
  }
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  y: number,
  colWidths: number[],
) {
  const headers = ['Name', 'Personen', 'Eingecheckt'];

  doc
    .rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, TABLE_HEADER_HEIGHT)
    .fillColor('#F2F2F2')
    .fill();

  let x = PAGE_MARGIN;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('black');

  headers.forEach((header, index) => {
    doc.text(header, x + 8, y + 8, {
      width: colWidths[index] - 16,
      align: index === 1 ? 'center' : 'left',
    });

    x += colWidths[index];
  });

  doc
    .moveTo(PAGE_MARGIN, y + TABLE_HEADER_HEIGHT)
    .lineTo(doc.page.width - PAGE_MARGIN, y + TABLE_HEADER_HEIGHT)
    .strokeColor('#000000')
    .lineWidth(1)
    .stroke();

  return y + TABLE_HEADER_HEIGHT;
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  y: number,
  values: string[],
  colWidths: number[],
  rowHeight: number,
) {
  const tableWidth = doc.page.width - PAGE_MARGIN * 2;

  doc
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_MARGIN + tableWidth, y)
    .strokeColor('#D9D9D9')
    .lineWidth(0.5)
    .stroke();

  let x = PAGE_MARGIN;

  doc.font('Helvetica').fontSize(11).fillColor('black');

  values.forEach((value, index) => {
    if (index === 2) {
      drawCheckbox(doc, x, y, colWidths[index], rowHeight);
    } else {
      doc.text(value, x + 8, y + 8, {
        width: colWidths[index] - 16,
        align: index === 1 ? 'center' : 'left',
      });
    }

    x += colWidths[index];
  });

  return y + rowHeight;
}

function drawCheckbox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  colWidth: number,
  rowHeight: number,
) {
  const size = 13;
  const checkboxX = x + colWidth / 2 - size / 2;
  const checkboxY = y + rowHeight / 2 - size / 2;

  doc
    .rect(checkboxX, checkboxY, size, size)
    .strokeColor('#000000')
    .lineWidth(1)
    .stroke();
}

function drawTableBottomLine(
  doc: PDFKit.PDFDocument,
  y: number,
  tableWidth: number,
) {
  doc
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_MARGIN + tableWidth, y)
    .strokeColor('#000000')
    .lineWidth(1)
    .stroke();
}

function getRowHeight(
  doc: PDFKit.PDFDocument,
  values: string[],
  colWidths: number[],
) {
  doc.font('Helvetica').fontSize(11);

  const nameHeight = doc.heightOfString(values[0], {
    width: colWidths[0] - 16,
  });

  return Math.max(ROW_MIN_HEIGHT, nameHeight + 16);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatTime(value: Date | string | null | undefined) {
  if (!value) return '';

  if (value instanceof Date) {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);
  }

  // Falls startTime bei dir z.B. schon "17:00" ist
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    return `${value} Uhr`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
