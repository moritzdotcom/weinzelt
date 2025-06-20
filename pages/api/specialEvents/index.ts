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
  } else if (req.method === 'POST') {
    await handlePOST(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetSpecialEventsResponse = Prisma.SpecialEventGetPayload<{
  include: {
    eventDate: { select: { id: true; date: true; dow: true } };
    _count: { select: { registrations: true } };
  };
}>[];

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query;

  if (typeof eventId == 'string') {
    const events = await prisma.specialEvent.findMany({
      where: { eventDate: { eventId } },
      include: {
        eventDate: { select: { id: true, date: true, dow: true } },
        _count: { select: { registrations: true } },
      },
    });
    return res.json(events);
  } else {
    const events = await prisma.specialEvent.findMany({
      include: {
        eventDate: { select: { id: true, date: true, dow: true } },
        _count: { select: { registrations: true } },
      },
    });
    return res.json(events);
  }
}

export type ApiPostSpecialEventResponse = {
  name: string;
  id: string;
  description: string;
  eventDateId: string;
  startTime: string;
  endTime: string;
};

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, startTime, endTime, eventDateId } = req.body;
  if (!name) return res.status(401).json('Name required');
  if (!description) return res.status(401).json('Description required');
  if (!startTime) return res.status(401).json('Start Time required');
  if (!endTime) return res.status(401).json('End Time required');
  if (!eventDateId) return res.status(401).json('Event Date required');

  const event = await prisma.specialEvent.create({
    data: { name, description, startTime, endTime, eventDateId },
  });

  return res.json(event);
}
