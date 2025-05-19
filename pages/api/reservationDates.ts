import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { Prisma } from '@prisma/client';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    await handleGET(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetReservationDatesResponse = Prisma.EventGetPayload<{
  select: {
    id: true;
    eventDates: {
      select: {
        date: true;
        dow: true;
        seatings: {
          select: {
            id: true;
            timeslot: true;
          };
        };
      };
    };
  };
}>;

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const reservations = await prisma.event.findFirst({
    where: { current: true },
    select: {
      id: true,
      eventDates: {
        select: {
          date: true,
          dow: true,
          seatings: {
            select: {
              id: true,
              timeslot: true,
            },
          },
        },
      },
    },
  });

  if (!reservations) return res.status(404).json('No Event Found');

  return res.json(reservations);
}
