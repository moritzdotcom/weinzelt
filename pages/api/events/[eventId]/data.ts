import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    await handleGET(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetEventDataResponse = Prisma.EventGetPayload<{
  include: {
    eventDates: {
      include: {
        seatings: {
          include: {
            reservations: true;
          };
        };
      };
    };
  };
}>;

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query;
  if (typeof eventId !== 'string')
    return res.status(401).json('Event required');

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventDates: {
        include: {
          seatings: {
            include: {
              reservations: true,
            },
          },
        },
      },
    },
  });

  return res.json(event);
}
