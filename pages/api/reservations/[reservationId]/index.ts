import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { Prisma, ReservationType } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { reservationId } = req.query;
  if (typeof reservationId !== 'string')
    return res.status(401).json('Reservation required');

  if (req.method === 'GET') {
    await handleGET(req, res, reservationId);
  } else if (req.method === 'PUT') {
    const session = await getServerSession(req);
    if (!session) return res.status(401).json('Not authenticated');

    await handlePUT(req, res, reservationId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

export type ApiGetReservationResponse = Prisma.ReservationGetPayload<{
  select: {
    id: true;
    paymentStatus: true;
    type: true;
    people: true;
    tableCount: true;
    minimumSpend: true;
    paidAt: true;
    seating: {
      select: {
        id: true;
        timeslot: true;
        eventDate: { select: { date: true } };
      };
    };
  };
}>;

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: {
      id: true,
      paymentStatus: true,
      type: true,
      people: true,
      tableCount: true,
      minimumSpend: true,
      paidAt: true,
      seating: {
        select: {
          id: true,
          timeslot: true,
          eventDate: { select: { date: true } },
        },
      },
    },
  });

  if (!reservation) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json({ reservation });
}

export type ApiPutReservationResponse = {
  name: string;
  id: string;
  email: string;
  createdAt: Date;
  seatingId: string;
  people: number;
  type: ReservationType;
  tableCount: number;
  minimumSpend: number;
  tableNumber: string | null;
  internalNotes: string | null;
  notified: Date | null;
  payed: boolean;
  pageVisitId: string | null;
  referralCodeId: string | null;
};

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
) {
  const {
    tableNumber,
    payed,
    name,
    email,
    people,
    tableCount,
    minimumSpend,
    internalNotes,
  } = req.body;

  const reservation = await prisma.reservation.update({
    data: {
      tableNumber,
      payed,
      name,
      email,
      people,
      tableCount,
      minimumSpend,
      internalNotes,
    },
    where: { id },
  });

  return res.json(reservation);
}
