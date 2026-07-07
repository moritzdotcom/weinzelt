import { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import fs from 'fs';
import path from 'path';

const PAGE_MARGIN = 40;
const TABLE_HEADER_HEIGHT = 26;
const ROW_MIN_HEIGHT = 30;
const LOGO_WIDTH = 180;
const HEADER_BOTTOM_GAP = 18;
const FOOTER_HEIGHT = 28;

const collator = new Intl.Collator('de-DE', {
  numeric: true,
  sensitivity: 'base',
});

type PageMeta = {
  timeslot: string;
  timeslotPageNumber: number;
};

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

  const { eventDateId } = req.query;

  if (typeof eventDateId !== 'string') {
    return res.status(400).json({ error: 'Event required' });
  }

  return handleGET(res, eventDateId);
}

async function handleGET(res: NextApiResponse, eventDateId: string) {
  const eventDate = await prisma.eventDate.findUnique({
    where: {
      id: eventDateId,
    },
    select: {
      date: true,
    },
  });

  if (!eventDate) {
    return res.status(404).json({
      error: 'Event date not found',
    });
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      seating: {
        eventDateId,
      },
      paymentStatus: {
        in: ['PAID', 'PENDING_PAYMENT'],
      },
    },
    select: {
      name: true,
      people: true,
      tableNumber: true,
      paymentStatus: true,
      seating: {
        select: {
          timeslot: true,
        },
      },
    },
  });

  type ReservationRow = (typeof reservations)[number];

  const grouped = reservations.reduce<Record<string, ReservationRow[]>>(
    (acc, reservation) => {
      const timeslot = reservation.seating.timeslot || 'Ohne Timeslot';

      if (!acc[timeslot]) {
        acc[timeslot] = [];
      }

      acc[timeslot].push(reservation);

      return acc;
    },
    {},
  );

  const timeslotGroups = Object.entries(grouped)
    .map(([timeslot, list]) => ({
      timeslot,
      list: list.sort(compareReservations),
    }))
    .sort((a, b) => compareTimeslots(a.timeslot, b.timeslot));

  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    bufferPages: true,
    autoFirstPage: false,
  });

  const dateLabel = formatDate(eventDate.date);
  const filename = `gaesteliste-${formatFileDate(eventDate.date)}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  doc.pipe(res);

  const pageMeta = new Map<number, PageMeta>();
  const timeslotPageCounts = new Map<string, number>();

  if (reservations.length === 0) {
    doc.addPage();

    const pageIndex = getCurrentBufferedPageIndex(doc);
    pageMeta.set(pageIndex, {
      timeslot: 'Ohne Reservierungen',
      timeslotPageNumber: 1,
    });
    timeslotPageCounts.set('Ohne Reservierungen', 1);

    const y = drawTimeslotPageHeader(doc, {
      timeslot: '',
      dateLabel,
      reservationCount: 0,
      peopleCount: 0,
    });

    drawEmptyState(
      doc,
      y,
      'Für diesen Tag gibt es keine bezahlten oder offenen Reservierungen.',
    );

    drawPageFooters(doc, pageMeta, timeslotPageCounts);
    doc.end();
    return;
  }

  for (const group of timeslotGroups) {
    const reservationCount = group.list.length;
    const peopleCount = group.list.reduce((sum, item) => sum + item.people, 0);

    let y = addTimeslotPage(doc, {
      timeslot: group.timeslot,
      dateLabel,
      reservationCount,
      peopleCount,
      pageMeta,
      timeslotPageCounts,
    });

    const colWidths = getColWidths(doc);
    const tableWidth = getTableWidth(doc);

    y = drawTableHeader(doc, y, colWidths);

    for (const reservation of group.list) {
      const values = getRowValues(reservation);
      const rowHeight = getRowHeight(doc, values, colWidths);

      if (y + rowHeight > getPageBottom(doc)) {
        y = addTimeslotPage(doc, {
          timeslot: group.timeslot,
          dateLabel,
          reservationCount,
          peopleCount,
          pageMeta,
          timeslotPageCounts,
          isContinuation: true,
        });

        y = drawTableHeader(doc, y, colWidths);
      }

      y = drawTableRow(doc, y, values, colWidths, rowHeight);
    }

    drawTableBottomLine(doc, y, tableWidth);
  }

  drawPageFooters(doc, pageMeta, timeslotPageCounts);

  doc.end();
}

function getTableWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - PAGE_MARGIN * 2;
}

function getColWidths(doc: PDFKit.PDFDocument) {
  const tableWidth = getTableWidth(doc);

  return [
    tableWidth * 0.42, // Name
    tableWidth * 0.12, // Personen
    tableWidth * 0.16, // Tisch
    tableWidth * 0.15, // Zahlung
    tableWidth * 0.15, // Check
  ];
}

function addTimeslotPage(
  doc: PDFKit.PDFDocument,
  params: {
    timeslot: string;
    dateLabel: string;
    reservationCount: number;
    peopleCount: number;
    pageMeta: Map<number, PageMeta>;
    timeslotPageCounts: Map<string, number>;
    isContinuation?: boolean;
  },
) {
  doc.addPage();

  const nextTimeslotPageNumber =
    (params.timeslotPageCounts.get(params.timeslot) || 0) + 1;

  params.timeslotPageCounts.set(params.timeslot, nextTimeslotPageNumber);

  const pageIndex = getCurrentBufferedPageIndex(doc);

  params.pageMeta.set(pageIndex, {
    timeslot: params.timeslot,
    timeslotPageNumber: nextTimeslotPageNumber,
  });

  return drawTimeslotPageHeader(doc, {
    timeslot: params.timeslot,
    dateLabel: params.dateLabel,
    reservationCount: params.reservationCount,
    peopleCount: params.peopleCount,
    isContinuation: params.isContinuation,
  });
}

function drawTimeslotPageHeader(
  doc: PDFKit.PDFDocument,
  params: {
    timeslot: string;
    dateLabel: string;
    reservationCount: number;
    peopleCount: number;
    isContinuation?: boolean;
  },
) {
  if (!params.isContinuation) drawLogo(doc);

  const contentWidth = doc.page.width - PAGE_MARGIN * 2;

  let y = params.isContinuation ? 44 : 106;

  const title = params.timeslot
    ? `Gästeliste Weinzelt ${params.timeslot}`
    : 'Gästeliste Weinzelt';

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('black')
    .text(title, PAGE_MARGIN, y, {
      width: contentWidth,
      align: 'center',
    });

  y = doc.y + 6;

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#555555')
    .text(
      [params.dateLabel, params.isContinuation ? 'Fortsetzung' : null]
        .filter(Boolean)
        .join(' · '),
      PAGE_MARGIN,
      y,
      {
        width: contentWidth,
        align: 'center',
      },
    );

  y = doc.y + 22;

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#555555')
    .text(
      `${params.reservationCount} Reservierungen · ${params.peopleCount} Personen`,
      PAGE_MARGIN,
      y,
      {
        width: contentWidth,
        align: 'right',
      },
    );

  y = doc.y + 10;

  doc
    .moveTo(PAGE_MARGIN, y)
    .lineTo(doc.page.width - PAGE_MARGIN, y)
    .strokeColor('#000000')
    .lineWidth(1)
    .stroke();

  return y + HEADER_BOTTOM_GAP;
}

function drawLogo(doc: PDFKit.PDFDocument) {
  const logoPath = path.resolve(process.cwd(), 'public', 'logo.png');

  if (!fs.existsSync(logoPath)) return;

  try {
    doc.image(logoPath, doc.page.width / 2 - LOGO_WIDTH / 2, 24, {
      width: LOGO_WIDTH,
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
  const headers = ['Name', 'Personen', 'Tisch', 'Zahlung', 'Check'];

  doc.save();

  doc
    .rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, TABLE_HEADER_HEIGHT)
    .fillColor('#F2F2F2')
    .fill();

  doc.restore();

  let x = PAGE_MARGIN;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('black');

  headers.forEach((header, index) => {
    doc.text(header, x + 8, y + 8, {
      width: colWidths[index] - 16,
      align: getColumnAlign(index),
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

  doc.font('Helvetica').fontSize(10.5).fillColor('black');

  values.forEach((value, index) => {
    if (index === 4) {
      drawCheckbox(doc, x, y, colWidths[index], rowHeight);
    } else {
      doc.text(value, x + 8, y + 8, {
        width: colWidths[index] - 16,
        align: getColumnAlign(index),
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

function drawEmptyState(doc: PDFKit.PDFDocument, y: number, text: string) {
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#555555')
    .text(text, PAGE_MARGIN, y + 20, {
      width: doc.page.width - PAGE_MARGIN * 2,
      align: 'center',
    });
}

function drawPageFooters(
  doc: PDFKit.PDFDocument,
  pageMeta: Map<number, PageMeta>,
  timeslotPageCounts: Map<string, number>,
) {
  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);

    const meta = pageMeta.get(i);

    if (!meta) continue;

    const totalTimeslotPages = timeslotPageCounts.get(meta.timeslot) || 1;

    const footerText = `${meta.timeslot} · Seite ${meta.timeslotPageNumber} von ${totalTimeslotPages}`;

    const footerY = doc.page.height - PAGE_MARGIN;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#777777')
      .text(footerText, PAGE_MARGIN, footerY, {
        width: doc.page.width - PAGE_MARGIN * 2,
        height: 10,
        align: 'center',
        lineBreak: false,
      });
  }
}

function getRowValues(reservation: {
  name: string | null;
  people: number;
  tableNumber: string | null;
  paymentStatus: string;
}) {
  return [
    reservation.name || '-',
    reservation.people.toString(),
    reservation.tableNumber || '-',
    formatPaymentStatus(reservation.paymentStatus),
    '',
  ];
}

function getRowHeight(
  doc: PDFKit.PDFDocument,
  values: string[],
  colWidths: number[],
) {
  doc.font('Helvetica').fontSize(10.5);

  const textHeights = values.slice(0, 4).map((value, index) =>
    doc.heightOfString(value, {
      width: colWidths[index] - 16,
      align: getColumnAlign(index),
    }),
  );

  return Math.max(ROW_MIN_HEIGHT, Math.max(...textHeights) + 16);
}

function getColumnAlign(index: number): 'left' | 'center' | 'right' {
  if (index === 1 || index === 2 || index === 3 || index === 4) {
    return 'center';
  }

  return 'left';
}

function getPageBottom(doc: PDFKit.PDFDocument) {
  return doc.page.height - PAGE_MARGIN - FOOTER_HEIGHT - 10;
}

function getCurrentBufferedPageIndex(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();

  return range.start + range.count - 1;
}

function compareReservations(
  a: {
    name: string | null;
  },
  b: {
    name: string | null;
  },
) {
  return collator.compare(a.name || '', b.name || '');
}

function compareTimeslots(a: string, b: string) {
  const minutesA = getFirstTimeInMinutes(a);
  const minutesB = getFirstTimeInMinutes(b);

  if (minutesA !== null && minutesB !== null) {
    return minutesA - minutesB;
  }

  if (minutesA !== null) return -1;
  if (minutesB !== null) return 1;

  return collator.compare(a, b);
}

function getFirstTimeInMinutes(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatPaymentStatus(value: string) {
  if (value === 'PAID') return 'bezahlt';
  if (value === 'PENDING_PAYMENT') return 'offen';

  return value;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatFileDate(value: Date | string | null | undefined) {
  if (!value) return 'unbekannt';

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'unbekannt';
  }

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
