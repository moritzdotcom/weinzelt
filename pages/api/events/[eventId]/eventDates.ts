import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  const { eventId } = req.query;
  if (typeof eventId !== 'string')
    return res.status(401).json('Event required');

  if (req.method === 'GET') {
    await handleGET(req, res, eventId);
  } else if (req.method === 'POST') {
    await handlePOST(req, res, eventId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

export type ApiGetEventDatesResponse = Prisma.EventDateGetPayload<{
  include: { seatings: { include: { externalTicketConfig: true } } };
}>[];

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
) {
  const eventDates = await prisma.eventDate.findMany({
    where: { eventId: id },
    include: { seatings: { include: { externalTicketConfig: true } } },
  });
  return res.json(eventDates);
}

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
) {
  const { date, dow } = req.body;
  if (typeof date !== 'string') return res.status(401).json('Date Required');
  if (typeof dow !== 'string')
    return res.status(401).json('Day of Week Required');

  const eventDate = await prisma.eventDate.create({
    data: { date, dow, eventId: id },
    include: { seatings: { include: { externalTicketConfig: true } } },
  });
  return res.json(eventDate);
}
