import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;
  if (typeof id !== 'string')
    return res.status(401).json('Reservation required');
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    await handleGET(req, res, id);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

export type ApiGetReservationBackendResponse = Prisma.ReservationGetPayload<{
  include: {
    seating: {
      select: {
        id: true;
        timeslot: true;
        eventDate: { select: { date: true } };
      };
    };
    invoice: true;
  };
}>;

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      seating: {
        select: {
          id: true,
          timeslot: true,
          eventDate: { select: { date: true } },
        },
      },
      invoice: true,
    },
  });

  if (!reservation) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json(reservation);
}
