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

  const { specialEventId } = req.query;
  if (typeof specialEventId !== 'string')
    return res.status(401).json('Special Event required');

  if (req.method === 'GET') {
    await handleGET(req, res, specialEventId);
  } else if (req.method === 'PUT') {
    await handlePUT(req, res, specialEventId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetSpecialEventResponse = Prisma.SpecialEventGetPayload<{
  include: {
    eventDate: { select: { id: true; date: true; dow: true } };
    registrations: true;
  };
}>;

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const event = await prisma.specialEvent.findUnique({
    where: { id },
    include: {
      eventDate: { select: { id: true, date: true, dow: true } },
      registrations: true,
    },
  });
  return res.json(event);
}

export type ApiPutSpecialEventResponse = {
  name: string;
  id: string;
  description: string;
  eventDateId: string;
  startTime: string;
  endTime: string;
};

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { name, description, startTime, endTime } = req.body;

  const event = await prisma.specialEvent.update({
    where: { id },
    data: { name, description, startTime, endTime },
  });

  return res.json(event);
}
