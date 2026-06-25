import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import {
  AdminSpecialEvent,
  getActiveRegistrationWhere,
  mapSpecialEventToAdmin,
} from '@/lib/specialEvents';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    await handleGET(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse<AdminSpecialEvent[] | { error: string }>,
) {
  const eventId =
    typeof req.query.eventId === 'string' ? req.query.eventId : undefined;

  const events = await prisma.specialEvent.findMany({
    where: eventId
      ? {
          eventId,
        }
      : undefined,
    orderBy: [
      {
        eventDate: {
          date: 'asc',
        },
      },
      {
        sortOrder: 'asc',
      },
      {
        startTime: 'asc',
      },
    ],
    include: {
      occurrences: {
        orderBy: [
          {
            sortOrder: 'asc',
          },
        ],
        include: {
          eventDate: true,
          registrations: {
            where: getActiveRegistrationWhere(),
            select: {
              id: true,
              personCount: true,
              status: true,
              paymentExpiresAt: true,
            },
          },
        },
      },
      _count: {
        select: {
          registrations: {
            where: {
              status: 'REGISTERED',
            },
          },
        },
      },
    },
  });

  return res.status(200).json(events.map(mapSpecialEventToAdmin));
}
