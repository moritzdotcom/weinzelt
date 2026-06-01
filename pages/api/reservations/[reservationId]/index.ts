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
    externalTicketPrice: true;
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
      externalTicketPrice: true,
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

export type ApiPutReservationResponse = Prisma.ReservationGetPayload<{
  include: {
    seating: {
      include: { eventDate: true };
    };
  };
}>;

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
) {
  const {
    tableNumber,
    paymentStatus,
    name,
    email,
    people,
    tableCount,
    minimumSpend,
    internalNotes,
    seatingId,
    billingAddress,
    shippingAddress,
    shippingSameAsBilling,
  } = req.body;

  const reservation = await prisma.reservation.update({
    data: {
      tableNumber,
      paymentStatus,
      name,
      email,
      people,
      tableCount,
      minimumSpend,
      internalNotes,
      seatingId,
      billingAddress,
      shippingAddress,
      shippingSameAsBilling,
    },
    where: { id },
    include: {
      seating: {
        include: { eventDate: true },
      },
    },
  });

  return res.json(reservation);
}
