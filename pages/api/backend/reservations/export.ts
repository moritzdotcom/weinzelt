// pages/api/backend/reservations/export.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import ExcelJS from 'exceljs';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import {
  Prisma,
  ReservationPaymentStatus,
  ReservationType,
} from '@prisma/client';
import {
  getAllReservationExportFieldKeys,
  getReservationExportFieldLabel,
  ReservationExportFieldKey,
  ReservationExportSortKey,
  RESERVATION_EXPORT_SORT_OPTIONS,
} from '@/lib/reservationsExportConfig';
import { translateState, translateType } from '@/lib/reservation';

type ExportRequestBody = {
  preview?: boolean;
  eventId?: string;
  q?: string;
  paymentStatus?: ReservationPaymentStatus | 'all';
  type?: ReservationType | 'all';
  eventDateId?: string;
  timeslot?: string;
  sort?: ReservationExportSortKey;
  fields?: ReservationExportFieldKey[];
};

type AddressJson = {
  company?: string;
  line1?: string;
  line2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
};

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    seating: {
      include: {
        eventDate: {
          include: {
            event: true;
          };
        };
      };
    };
    referralCode: true;
    invoice: true;
  };
}>;

const MONEY_FIELDS: ReservationExportFieldKey[] = [
  'minimumSpend',
  'externalTicketPrice',
  'invoiceTotal',
];

const money = (cents?: number | null) =>
  cents == null ? '' : Number(cents) / 100;

const dateTime = (value?: Date | null) => {
  if (!value) return '';

  return value.toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

function parseAddress(value: unknown): AddressJson {
  if (!value || typeof value !== 'object') return {};
  return value as AddressJson;
}

function countryLabel(country?: string) {
  if (!country) return '';
  if (country === 'DE') return 'Deutschland';
  return country;
}

const fieldValueGetters: Record<
  ReservationExportFieldKey,
  (r: ReservationWithRelations) => string | number
> = {
  id: (r) => r.id,
  name: (r) => r.name,
  email: (r) => r.email,
  people: (r) => r.people,
  type: (r) => translateType(r.type) ?? '',
  paymentStatus: (r) => translateState(r.paymentStatus) ?? '',

  eventName: (r) => r.seating.eventDate.event.name,
  eventDate: (r) => r.seating.eventDate.date,
  eventDow: (r) => r.seating.eventDate.dow,
  timeslot: (r) => r.seating.timeslot,

  minimumSpend: (r) => r.minimumSpend,
  externalTicketPrice: (r) => r.externalTicketPrice,
  tableCount: (r) => r.tableCount,
  tableNumber: (r) => r.tableNumber ?? '',
  internalNotes: (r) => r.internalNotes ?? '',

  createdAt: (r) => dateTime(r.createdAt),
  paidAt: (r) => dateTime(r.paidAt),
  manualPaymentTrackedBy: (r) => r.manualPaymentTrackedBy ?? '',
  canceledAt: (r) => dateTime(r.canceledAt),

  referralCode: (r) => r.referralCode?.code ?? '',

  invoiceNumber: (r) => r.invoice?.invoiceNumber ?? '',
  invoiceTotal: (r) => money(r.invoice?.totalCents),
  invoiceIssuedAt: (r) => dateTime(r.invoice?.issuedAt),

  billingCompany: (r) => parseAddress(r.billingAddress).company ?? '',
  billingLine1: (r) => parseAddress(r.billingAddress).line1 ?? '',
  billingLine2: (r) => parseAddress(r.billingAddress).line2 ?? '',
  billingPostalCode: (r) => parseAddress(r.billingAddress).postalCode ?? '',
  billingCity: (r) => parseAddress(r.billingAddress).city ?? '',
  billingCountry: (r) => countryLabel(parseAddress(r.billingAddress).country),

  shippingCompany: (r) => parseAddress(r.shippingAddress).company ?? '',
  shippingLine1: (r) => parseAddress(r.shippingAddress).line1 ?? '',
  shippingLine2: (r) => parseAddress(r.shippingAddress).line2 ?? '',
  shippingPostalCode: (r) => parseAddress(r.shippingAddress).postalCode ?? '',
  shippingCity: (r) => parseAddress(r.shippingAddress).city ?? '',
  shippingCountry: (r) => countryLabel(parseAddress(r.shippingAddress).country),

  stripeCheckoutSessionId: (r) => r.stripeCheckoutSessionId ?? '',
  stripePaymentIntentId: (r) => r.stripePaymentIntentId ?? '',
};

function getSortValue(
  reservation: ReservationWithRelations,
  sort: ReservationExportSortKey,
): string | number {
  switch (sort) {
    case 'eventDateAsc':
    case 'eventDateDesc':
      return reservation.seating.eventDate.date;

    case 'timeslotAsc':
    case 'timeslotDesc':
      return reservation.seating.timeslot;

    case 'nameAsc':
    case 'nameDesc':
      return reservation.name.toLowerCase();

    case 'createdAtAsc':
    case 'createdAtDesc':
      return reservation.createdAt.getTime();

    case 'peopleAsc':
    case 'peopleDesc':
      return reservation.people;

    case 'minimumSpendAsc':
    case 'minimumSpendDesc':
      return reservation.minimumSpend;

    case 'tableNumberAsc':
    case 'tableNumberDesc':
      return reservation.tableNumber ?? '';

    default:
      return reservation.createdAt.getTime();
  }
}

function sortReservations(
  reservations: ReservationWithRelations[],
  sort: ReservationExportSortKey,
) {
  const desc = sort.endsWith('Desc');

  return [...reservations].sort((a, b) => {
    const av = getSortValue(a, sort);
    const bv = getSortValue(b, sort);

    if (typeof av === 'number' && typeof bv === 'number') {
      return desc ? bv - av : av - bv;
    }

    return desc
      ? String(bv).localeCompare(String(av), 'de-DE', { numeric: true })
      : String(av).localeCompare(String(bv), 'de-DE', { numeric: true });
  });
}

function isValidPaymentStatus(
  value: unknown,
): value is ReservationPaymentStatus {
  return (
    typeof value === 'string' &&
    Object.values(ReservationPaymentStatus).includes(
      value as ReservationPaymentStatus,
    )
  );
}

function isValidReservationType(value: unknown): value is ReservationType {
  return (
    typeof value === 'string' &&
    Object.values(ReservationType).includes(value as ReservationType)
  );
}

function sanitizeFields(fields: unknown): ReservationExportFieldKey[] {
  const orderedFieldKeys = getAllReservationExportFieldKeys();
  const allowed = new Set(orderedFieldKeys);

  const defaultFields: ReservationExportFieldKey[] = [
    'eventDate',
    'eventDow',
    'timeslot',
    'name',
    'email',
    'people',
    'type',
    'paymentStatus',
    'minimumSpend',
    'tableNumber',
    'paidAt',
    'createdAt',
  ];

  if (!Array.isArray(fields)) {
    return defaultFields;
  }

  const selectedSet = new Set(
    fields.filter(
      (field): field is ReservationExportFieldKey =>
        typeof field === 'string' &&
        allowed.has(field as ReservationExportFieldKey),
    ),
  );

  const sanitized = orderedFieldKeys.filter((field) => selectedSet.has(field));

  return sanitized.length > 0 ? sanitized : defaultFields;
}

function sanitizeSort(sort: unknown): ReservationExportSortKey {
  const allowed = new Set(
    RESERVATION_EXPORT_SORT_OPTIONS.map((option) => option.key),
  );

  if (
    typeof sort === 'string' &&
    allowed.has(sort as ReservationExportSortKey)
  ) {
    return sort as ReservationExportSortKey;
  }

  return 'eventDateAsc';
}

function mapReservationToRow(
  reservation: ReservationWithRelations,
  selectedFields: ReservationExportFieldKey[],
) {
  const row: Record<string, string | number> = {};

  for (const field of selectedFields) {
    row[field] = fieldValueGetters[field](reservation);
  }

  return row;
}

function buildWhere(body: ExportRequestBody): Prisma.ReservationWhereInput {
  const eventId = typeof body.eventId === 'string' ? body.eventId : '';
  const q = typeof body.q === 'string' ? body.q.trim() : '';
  const eventDateId =
    typeof body.eventDateId === 'string' ? body.eventDateId.trim() : '';
  const timeslot =
    typeof body.timeslot === 'string' ? body.timeslot.trim() : '';

  return {
    seating: {
      is: {
        ...(eventDateId ? { eventDateId } : {}),
        ...(timeslot ? { timeslot } : {}),
        eventDate: {
          is: {
            eventId,
          },
        },
      },
    },

    ...(q
      ? {
          OR: [
            {
              name: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              tableNumber: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              id: q,
            },
          ],
        }
      : {}),

    ...(body.paymentStatus && body.paymentStatus !== 'all'
      ? isValidPaymentStatus(body.paymentStatus)
        ? { paymentStatus: body.paymentStatus }
        : {}
      : {}),

    ...(body.type && body.type !== 'all'
      ? isValidReservationType(body.type)
        ? { type: body.type }
        : {}
      : {}),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req);
  if (!session) return res.status(401).json({ message: 'Not authenticated' });

  const body = req.body as ExportRequestBody;

  const eventId = typeof body.eventId === 'string' ? body.eventId : '';

  if (!eventId) {
    return res.status(400).json({ message: 'eventId is required' });
  }

  const selectedFields = sanitizeFields(body.fields);
  const sort = sanitizeSort(body.sort);
  const where = buildWhere(body);

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      seating: {
        include: {
          eventDate: {
            include: {
              event: true,
            },
          },
        },
      },
      referralCode: true,
      invoice: true,
    },
  });

  const sortedReservations = sortReservations(reservations, sort);

  if (body.preview) {
    return res.status(200).json({
      total: sortedReservations.length,
      columns: selectedFields.map((field) => ({
        key: field,
        label: getReservationExportFieldLabel(field),
      })),
      rows: sortedReservations
        .slice(0, 10)
        .map((reservation) => mapReservationToRow(reservation, selectedFields)),
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Weinzelt Backend';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Reservierungen');

  worksheet.columns = selectedFields.map((field) => ({
    header: getReservationExportFieldLabel(field),
    key: field,
    width: Math.max(14, getReservationExportFieldLabel(field).length + 4),
  }));

  for (const reservation of sortedReservations) {
    worksheet.addRow(mapReservationToRow(reservation, selectedFields));
  }

  selectedFields.forEach((field, index) => {
    if (!MONEY_FIELDS.includes(field)) return;

    const column = worksheet.getColumn(index + 1);
    column.numFmt = '#,##0.00 €';

    column.eachCell((cell, rowNumber) => {
      if (rowNumber === 1) return;

      if (cell.value === '') {
        cell.value = null;
        return;
      }

      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00 €';
      }
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: 'middle' };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  if (selectedFields.length > 0) {
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: selectedFields.length,
      },
    };
  }

  worksheet.columns.forEach((column) => {
    let maxLength = Number(column.width ?? 14);

    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = cell.value ? String(cell.value) : '';
      maxLength = Math.max(maxLength, value.length + 2);
    });

    column.width = Math.min(maxLength, 45);
  });

  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
    select: {
      name: true,
    },
  });

  const safeEventName =
    event?.name
      ?.replace(/[^a-z0-9äöüß\-_\s]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase() || 'event';

  const filename = `reservierungen_${safeEventName}_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  return res.status(200).send(Buffer.from(buffer));
}
