import type { NextApiRequest, NextApiResponse } from 'next';
import { ReservationPaymentStatus, ReservationType } from '@prisma/client';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';

export type TableNumberReservation = {
  id: string;
  type: ReservationType;
  name: string;
  email: string;
  people: number;
  tableCount: number;
  tableNumber: string | null;
  internalNotes: string | null;
  paymentStatus: ReservationPaymentStatus;
  createdAt: string;
  seating: {
    id: string;
    timeslot: string;
    eventDateId: string;
  };
};

export type ApiGetTableNumbersResponse = {
  eventDate: {
    id: string;
    date: string;
    dow: string;
    event: {
      id: string;
      name: string;
    };
  };
  reservations: TableNumberReservation[];
};

export type ApiPutTableNumbersBody = {
  updates: Array<{
    reservationId: string;
    tableNumber: string | null;
  }>;
};

export type ApiPutTableNumbersResponse = {
  updated: Array<{
    id: string;
    tableNumber: string | null;
  }>;
};

type ApiErrorResponse = {
  error: string;
};

const MAX_TABLE_NUMBER_LENGTH = 100;
const MAX_UPDATES_PER_REQUEST = 500;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    ApiGetTableNumbersResponse | ApiPutTableNumbersResponse | ApiErrorResponse
  >,
) {
  const session = await getServerSession(req);

  if (!session) {
    return res.status(401).json({ error: 'Nicht autorisiert.' });
  }

  const { eventDateId } = req.query;

  if (typeof eventDateId !== 'string') {
    return res.status(400).json({ error: 'EventDate erforderlich.' });
  }

  if (req.method === 'GET') {
    return handleGet(res, eventDateId);
  }

  if (req.method === 'PUT') {
    return handlePut(req, res, eventDateId);
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({
    error: `Die HTTP-Methode ${req.method} wird nicht unterstützt.`,
  });
}

async function handleGet(
  res: NextApiResponse<ApiGetTableNumbersResponse | ApiErrorResponse>,
  eventDateId: string,
) {
  const eventDate = await prisma.eventDate.findUnique({
    where: {
      id: eventDateId,
    },
    select: {
      id: true,
      date: true,
      dow: true,
      event: {
        select: {
          id: true,
          name: true,
        },
      },
      seatings: {
        select: {
          id: true,
          timeslot: true,
          eventDateId: true,
          reservations: {
            where: {
              paymentStatus: {
                in: [
                  ReservationPaymentStatus.PAID,
                  ReservationPaymentStatus.PENDING_PAYMENT,
                ],
              },
              canceledAt: null,
            },
            select: {
              id: true,
              type: true,
              name: true,
              email: true,
              people: true,
              tableCount: true,
              tableNumber: true,
              internalNotes: true,
              paymentStatus: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!eventDate) {
    return res.status(404).json({ error: 'Veranstaltungstag nicht gefunden.' });
  }

  const reservations: TableNumberReservation[] = eventDate.seatings.flatMap(
    (seating) =>
      seating.reservations.map((reservation) => ({
        ...reservation,
        createdAt: reservation.createdAt.toISOString(),
        seating: {
          id: seating.id,
          timeslot: seating.timeslot,
          eventDateId: seating.eventDateId,
        },
      })),
  );

  return res.status(200).json({
    eventDate: {
      id: eventDate.id,
      date: eventDate.date,
      dow: eventDate.dow,
      event: eventDate.event,
    },
    reservations,
  });
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<ApiPutTableNumbersResponse | ApiErrorResponse>,
  eventDateId: string,
) {
  const parsedUpdates = parseUpdates(req.body);

  if ('error' in parsedUpdates) {
    return res.status(400).json({ error: parsedUpdates.error });
  }

  if (parsedUpdates.updates.length === 0) {
    return res.status(200).json({ updated: [] });
  }

  const reservationIds = parsedUpdates.updates.map(
    ({ reservationId }) => reservationId,
  );

  const matchingReservations = await prisma.reservation.findMany({
    where: {
      id: {
        in: reservationIds,
      },
      seating: {
        eventDateId,
      },
    },
    select: {
      id: true,
    },
  });

  if (matchingReservations.length !== reservationIds.length) {
    const matchingIds = new Set(matchingReservations.map(({ id }) => id));
    const invalidIds = reservationIds.filter((id) => !matchingIds.has(id));

    return res.status(400).json({
      error: `Mindestens eine Reservierung gehört nicht zu diesem Veranstaltungstag: ${invalidIds.join(
        ', ',
      )}`,
    });
  }

  const updated = await prisma.$transaction(
    parsedUpdates.updates.map(({ reservationId, tableNumber }) =>
      prisma.reservation.update({
        where: {
          id: reservationId,
        },
        data: {
          tableNumber,
        },
        select: {
          id: true,
          tableNumber: true,
        },
      }),
    ),
  );

  return res.status(200).json({ updated });
}

function parseUpdates(
  body: unknown,
): { updates: ApiPutTableNumbersBody['updates'] } | { error: string } {
  if (!body || typeof body !== 'object' || !('updates' in body)) {
    return { error: 'Das Feld „updates“ fehlt.' };
  }

  const rawUpdates = (body as { updates?: unknown }).updates;

  if (!Array.isArray(rawUpdates)) {
    return { error: '„updates“ muss ein Array sein.' };
  }

  if (rawUpdates.length > MAX_UPDATES_PER_REQUEST) {
    return {
      error: `Pro Anfrage können maximal ${MAX_UPDATES_PER_REQUEST} Reservierungen aktualisiert werden.`,
    };
  }

  const deduplicated = new Map<
    string,
    ApiPutTableNumbersBody['updates'][number]
  >();

  for (const rawUpdate of rawUpdates) {
    if (!rawUpdate || typeof rawUpdate !== 'object') {
      return { error: 'Mindestens ein Update ist ungültig.' };
    }

    const { reservationId, tableNumber } = rawUpdate as {
      reservationId?: unknown;
      tableNumber?: unknown;
    };

    if (typeof reservationId !== 'string' || !reservationId.trim()) {
      return { error: 'Jedes Update benötigt eine reservationId.' };
    }

    if (tableNumber !== null && typeof tableNumber !== 'string') {
      return {
        error: 'tableNumber muss ein String oder null sein.',
      };
    }

    const normalizedTableNumber =
      typeof tableNumber === 'string' && tableNumber.trim()
        ? tableNumber.trim()
        : null;

    if (
      normalizedTableNumber &&
      normalizedTableNumber.length > MAX_TABLE_NUMBER_LENGTH
    ) {
      return {
        error: `Eine Tischnummer darf maximal ${MAX_TABLE_NUMBER_LENGTH} Zeichen lang sein.`,
      };
    }

    deduplicated.set(reservationId, {
      reservationId,
      tableNumber: normalizedTableNumber,
    });
  }

  return {
    updates: [...deduplicated.values()],
  };
}
