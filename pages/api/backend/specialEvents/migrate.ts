import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

async function migrateSpeicalEvents() {
  const events = await prisma.specialEvent.findMany({
    where: {
      eventDateId: {
        not: null,
      },
    },
    include: {
      eventDate: {
        select: {
          eventId: true,
        },
      },
    },
  });

  for (const event of events) {
    if (!event.eventDateId || !event.startTime || !event.endTime) continue;

    await prisma.specialEvent.update({
      where: { id: event.id },
      data: { eventId: event.eventDate?.eventId },
    });

    const occurrence = await prisma.specialEventOccurrence.upsert({
      where: {
        specialEventId_eventDateId: {
          specialEventId: event.id,
          eventDateId: event.eventDateId,
        },
      },
      create: {
        specialEventId: event.id,
        eventDateId: event.eventDateId,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
      },
      update: {
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
      },
    });

    await prisma.eventRegistration.updateMany({
      where: {
        specialEventId: event.id,
        specialEventOccurrenceId: null as any,
      },
      data: {
        specialEventOccurrenceId: occurrence.id,
      },
    });
  }
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    try {
      await migrateSpeicalEvents();
      return res.json({ ok: true });
    } catch (error) {
      return res.status(400).json(error);
    }
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}
