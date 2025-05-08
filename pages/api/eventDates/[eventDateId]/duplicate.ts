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
  const { eventDateId } = req.query;
  if (typeof eventDateId !== 'string')
    return res.status(401).json('Event required');

  if (req.method === 'POST') {
    await handlePOST(req, res, eventDateId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiPostDuplicateEventDateResponse = Prisma.EventDateGetPayload<{
  include: { seatings: true };
}>[];

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { date, dow } = req.body;
  if (typeof date !== 'string')
    return res.status(401).json('Availability Required');
  if (typeof dow !== 'string')
    return res.status(401).json('FoodRequired Required');

  const eventDate = await prisma.eventDate.findUnique({
    where: { id },
    include: { seatings: true },
  });
  if (!eventDate) return res.status(404).json('No EventDate found');

  const newEventDate = await prisma.eventDate.create({
    data: {
      date,
      dow,
      eventId: eventDate?.eventId,
      seatings: {
        createMany: {
          data: eventDate.seatings.map((s) => ({
            ...s,
            id: undefined,
            eventDateId: undefined,
          })),
        },
      },
    },
    include: { seatings: true },
  });

  return res.json(newEventDate);
}
