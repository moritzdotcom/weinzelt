import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    await handleGET(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

export type ApiGetReservationDataResponse = Prisma.EventGetPayload<{
  select: {
    eventDates: {
      select: {
        date: true;
        dow: true;
        seatings: {
          select: {
            id: true;
            availableVip: true;
            availableStanding: true;
            timeslot: true;
            minimumSpendVip: true;
            minimumSpendStanding: true;
            reservations: { select: { tableCount: true; type: true } };
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
      eventDates: {
        select: {
          date: true,
          dow: true,
          seatings: {
            select: {
              id: true,
              availableVip: true,
              availableStanding: true,
              timeslot: true,
              minimumSpendVip: true,
              minimumSpendStanding: true,
              reservations: {
                where: {
                  paymentStatus: 'PAID',
                },
                select: { tableCount: true, type: true },
              },
            },
          },
        },
      },
    },
  });

  if (!reservations) {
    const session = await getServerSession(req);
    if (!session) return res.status(404).json('No Event Found');

    const reservations = await prisma.event.findFirst({
      select: {
        eventDates: {
          select: {
            date: true,
            dow: true,
            seatings: {
              select: {
                id: true,
                availableVip: true,
                availableStanding: true,
                timeslot: true,
                minimumSpendVip: true,
                minimumSpendStanding: true,
                reservations: {
                  where: {
                    paymentStatus: 'PAID',
                  },
                  select: { tableCount: true, type: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(reservations);
  }

  return res.json(reservations);
}
