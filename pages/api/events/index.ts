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

export type ApiGetEventsResponse = Prisma.EventGetPayload<{
  include: { eventDates: { select: { id: true; date: true; dow: true } } };
}>[];

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const events = await prisma.event.findMany({
    include: { eventDates: { select: { id: true, date: true, dow: true } } },
  });
  return res.json(events);
}

export type ApiPostEventResponse = {
  name: string;
  id: string;
  current: boolean;
};

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body;
  if (!name) return res.status(401).json('Name required');

  const event = await prisma.event.create({ data: { name, current: false } });

  return res.json(event);
}
