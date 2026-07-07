import { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import fs from 'fs';
import path from 'path';

const PAGE_MARGIN = 40;
const TABLE_HEADER_HEIGHT = 26;
const ROW_MIN_HEIGHT = 42;
const LOGO_WIDTH = 180;
const HEADER_BOTTOM_GAP = 18;
const FOOTER_HEIGHT = 34;

const collator = new Intl.Collator('de-DE', {
  numeric: true,
  sensitivity: 'base',
});

type PageMeta = {
  timeslot: string;
  timeslotPageNumber: number;
};

type TimeslotStats = {
  reservationCount: number;
  peopleCount: number;
  vipUsed: number;
  vipAvailable: number | null;
  standingUsed: number;
  standingAvailable: number | null;
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
      type: true,
      paymentStatus: true,
      name: true,
      people: true,
      tableNumber: true,
      tableCount: true,
      internalNotes: true,
      minimumSpend: true,
      seating: {
        select: {
          timeslot: true,
          availableStanding: true,
          availableVip: true,
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
  const filename = `tischbelegung-${formatFileDate(eventDate.date)}.pdf`;

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
      stats: {
        reservationCount: 0,
        peopleCount: 0,
        vipUsed: 0,
        vipAvailable: null,
        standingUsed: 0,
        standingAvailable: null,
      },
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
    const stats = getTimeslotStats(group.list);

    let y = addTimeslotPage(doc, {
      timeslot: group.timeslot,
      dateLabel,
      stats,
      pageMeta,
      timeslotPageCounts,
    });

    const colWidths = getColWidths(doc);
    const tableWidth = getTableWidth(doc);

    y = drawTableHeader(doc, y, colWidths);

    for (const reservation of group.list) {
      const row = getRowData(reservation);
      const rowHeight = getRowHeight(doc, row, colWidths);

      if (y + rowHeight > getPageBottom(doc)) {
        y = addTimeslotPage(doc, {
          timeslot: group.timeslot,
          dateLabel,
          stats,
          pageMeta,
          timeslotPageCounts,
          isContinuation: true,
        });

        y = drawTableHeader(doc, y, colWidths);
      }

      y = drawTableRow(doc, y, row, colWidths, rowHeight);
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
    tableWidth * 0.09, // Typ
    tableWidth * 0.39, // Name
    tableWidth * 0.12, // Personen
    tableWidth * 0.12, // Tische
    tableWidth * 0.15, // Tischnummer
    tableWidth * 0.13, // Zahlung
  ];
}

function addTimeslotPage(
  doc: PDFKit.PDFDocument,
  params: {
    timeslot: string;
    dateLabel: string;
    stats: TimeslotStats;
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
    stats: params.stats,
    isContinuation: params.isContinuation,
  });
}

function drawTimeslotPageHeader(
  doc: PDFKit.PDFDocument,
  params: {
    timeslot: string;
    dateLabel: string;
    stats: TimeslotStats;
    isContinuation?: boolean;
  },
) {
  if (!params.isContinuation) {
    drawLogo(doc);
  }

  const contentWidth = doc.page.width - PAGE_MARGIN * 2;

  let y = params.isContinuation ? 44 : 106;

  const title = params.timeslot
    ? `Tischbelegung Weinzelt ${params.timeslot}`
    : 'Tischbelegung Weinzelt';

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

  y = doc.y + 20;

  drawStatsBar(doc, y, params.stats);

  y += 30;

  doc
    .moveTo(PAGE_MARGIN, y)
    .lineTo(doc.page.width - PAGE_MARGIN, y)
    .strokeColor('#000000')
    .lineWidth(1)
    .stroke();

  return y + HEADER_BOTTOM_GAP;
}

function drawStatsBar(
  doc: PDFKit.PDFDocument,
  y: number,
  stats: TimeslotStats,
) {
  const contentWidth = doc.page.width - PAGE_MARGIN * 2;

  const leftText = `${stats.reservationCount} Reservierungen · ${stats.peopleCount} Personen`;

  const rightText = [
    `VIP: ${stats.vipUsed} / ${formatCapacity(stats.vipAvailable)}`,
    `ST: ${stats.standingUsed} / ${formatCapacity(stats.standingAvailable)}`,
  ].join('   ');

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#555555')
    .text(leftText, PAGE_MARGIN, y, {
      width: contentWidth / 2,
      align: 'left',
      lineBreak: false,
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('black')
    .text(rightText, PAGE_MARGIN + contentWidth / 2, y, {
      width: contentWidth / 2,
      align: 'right',
      lineBreak: false,
    });
}

function drawLogo(doc: PDFKit.PDFDocument) {
  const logoPath = path.resolve(process.cwd(), 'public', 'logo.png');

  if (!fs.existsSync(logoPath)) return;

  try {
    doc.image(logoPath, doc.page.width / 2 - LOGO_WIDTH / 2, 24, {
      width: LOGO_WIDTH,
    });
  } catch (error) {
    console.error('[tablePlanPdf] Could not render logo:', error);
  }
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  y: number,
  colWidths: number[],
) {
  const headers = ['Typ', 'Name', 'Pers.', 'Tische', 'Tisch', 'Zahlung'];

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
  row: TableRowData,
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

  drawTypeBadge(doc, row.typeLabel, x, y, colWidths[0], rowHeight);
  x += colWidths[0];

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('black')
    .text(row.name, x + 8, y + 8, {
      width: colWidths[1] - 16,
      align: 'left',
    });

  x += colWidths[1];

  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor('black')
    .text(row.people, x + 8, y + 8, {
      width: colWidths[2] - 16,
      align: 'center',
    });

  x += colWidths[2];

  doc.text(row.tableCount, x + 8, y + 8, {
    width: colWidths[3] - 16,
    align: 'center',
  });

  x += colWidths[3];

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('black')
    .text(row.tableNumber, x + 8, y + 8, {
      width: colWidths[4] - 16,
      align: 'center',
    });

  x += colWidths[4];

  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(row.paymentStatus === 'bezahlt' ? '#222222' : '#777777')
    .text(row.paymentStatus, x + 8, y + 8, {
      width: colWidths[5] - 16,
      align: 'center',
    });

  const metaX = PAGE_MARGIN + colWidths[0] + 8;
  const metaY = y + 25;
  const metaWidth = tableWidth - colWidths[0] - 16;

  let currentMetaY = metaY;

  if (row.minimumSpendText) {
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#555555')
      .text(row.minimumSpendText, metaX, currentMetaY, {
        width: metaWidth,
        align: 'left',
      });

    currentMetaY = doc.y + 3;
  }

  if (row.internalNotesText) {
    doc
      .font('Helvetica-Oblique')
      .fontSize(9.5)
      .fillColor('#555555')
      .text(row.internalNotesText, metaX, currentMetaY, {
        width: metaWidth,
        align: 'left',
      });
  }

  return y + rowHeight;
}

function drawTypeBadge(
  doc: PDFKit.PDFDocument,
  label: string,
  x: number,
  y: number,
  colWidth: number,
  rowHeight: number,
) {
  const badgeWidth = 30;
  const badgeHeight = 15;
  const badgeX = x + colWidth / 2 - badgeWidth / 2;
  const badgeY = y + rowHeight / 2 - badgeHeight / 2;

  doc
    .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3)
    .strokeColor('#000000')
    .lineWidth(0.8)
    .stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor('black')
    .text(label, badgeX, badgeY + 4, {
      width: badgeWidth,
      align: 'center',
      lineBreak: false,
    });
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
    const footerY = doc.page.height - PAGE_MARGIN - 18;

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

type TableRowData = {
  typeLabel: string;
  name: string;
  people: string;
  tableCount: string;
  tableNumber: string;
  paymentStatus: string;
  minimumSpendText: string;
  internalNotesText: string;
};

function getRowData(reservation: {
  type: string;
  paymentStatus: string;
  name: string | null;
  people: number;
  tableNumber: string | null;
  tableCount: number | null;
  internalNotes: string | null;
  minimumSpend: unknown;
}): TableRowData {
  return {
    typeLabel: formatReservationType(reservation.type),
    name: reservation.name || '-',
    people: reservation.people.toString(),
    tableCount: reservation.tableCount
      ? reservation.tableCount.toString()
      : '-',
    tableNumber: reservation.tableNumber || '-',
    paymentStatus: formatPaymentStatus(reservation.paymentStatus),
    minimumSpendText: `Mindestverzehr: ${formatMinimumSpend(
      reservation.minimumSpend,
    )}`,
    internalNotesText: formatInternalNotes(reservation.internalNotes),
  };
}

function getRowHeight(
  doc: PDFKit.PDFDocument,
  row: TableRowData,
  colWidths: number[],
) {
  const tableWidth = doc.page.width - PAGE_MARGIN * 2;

  doc.font('Helvetica-Bold').fontSize(11);

  const nameHeight = doc.heightOfString(row.name, {
    width: colWidths[1] - 16,
    align: 'left',
  });

  let metaHeight = 0;

  const metaWidth = tableWidth - colWidths[0] - 16;

  if (row.minimumSpendText) {
    doc.font('Helvetica').fontSize(9.5);

    metaHeight += doc.heightOfString(row.minimumSpendText, {
      width: metaWidth,
    });

    metaHeight += 3;
  }

  if (row.internalNotesText) {
    doc.font('Helvetica-Oblique').fontSize(9.5);

    metaHeight += doc.heightOfString(row.internalNotesText, {
      width: metaWidth,
    });
  }

  return Math.max(
    ROW_MIN_HEIGHT,
    25 + Math.max(nameHeight, 13) + metaHeight + 10,
  );
}

function getTimeslotStats(
  reservations: Array<{
    type: string;
    people: number;
    tableCount: number | null;
    seating: {
      availableVip: number | null;
      availableStanding: number | null;
    };
  }>,
): TimeslotStats {
  const first = reservations[0];

  return {
    reservationCount: reservations.length,
    peopleCount: reservations.reduce((sum, item) => sum + item.people, 0),
    vipUsed: reservations
      .filter((item) => item.type === 'VIP')
      .reduce((sum, item) => sum + (item.tableCount || 0), 0),
    vipAvailable: first?.seating.availableVip ?? null,
    standingUsed: reservations
      .filter((item) => item.type === 'STANDING')
      .reduce((sum, item) => sum + (item.tableCount || 0), 0),
    standingAvailable: first?.seating.availableStanding ?? null,
  };
}

function getColumnAlign(index: number): 'left' | 'center' | 'right' {
  if (index === 1) return 'left';

  return 'center';
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
    type: string;
    tableNumber: string | null;
    name: string | null;
  },
  b: {
    type: string;
    tableNumber: string | null;
    name: string | null;
  },
) {
  const tableA = a.tableNumber?.trim();
  const tableB = b.tableNumber?.trim();

  if (tableA && tableB) {
    const tableCompare = collator.compare(tableA, tableB);

    if (tableCompare !== 0) {
      return tableCompare;
    }
  }

  if (tableA && !tableB) return -1;
  if (!tableA && tableB) return 1;

  const typeCompare = getTypeSortValue(a.type) - getTypeSortValue(b.type);

  if (typeCompare !== 0) {
    return typeCompare;
  }

  return collator.compare(a.name || '', b.name || '');
}

function getTypeSortValue(type: string) {
  if (type === 'VIP') return 0;
  if (type === 'STANDING') return 1;

  return 2;
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

function formatReservationType(value: string) {
  if (value === 'VIP') return 'VIP';
  if (value === 'STANDING') return 'ST';

  return value;
}

function formatPaymentStatus(value: string) {
  if (value === 'PAID') return 'bezahlt';
  if (value === 'PENDING_PAYMENT') return 'offen';

  return value;
}

function formatMinimumSpend(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numericValue =
    typeof value === 'number'
      ? value
      : Number(
          typeof value === 'object' && 'toString' in value
            ? value.toString()
            : value,
        );

  if (Number.isNaN(numericValue)) {
    return `${String(value)} €`;
  }

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: numericValue % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatInternalNotes(value: string | null) {
  const normalized = value?.trim();

  if (!normalized) return '';

  return `Interne Notiz: ${normalized}`;
}

function formatCapacity(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';

  return value.toString();
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
