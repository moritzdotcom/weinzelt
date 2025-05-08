import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'POST') {
    await handlePOST(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiPostEventActivateResponse = {
  name: string;
  id: string;
  createdAt: Date;
  current: boolean;
};

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query;
  if (typeof eventId !== 'string')
    return res.status(401).json('Event required');

  await prisma.event.updateMany({
    data: { current: false },
    where: { current: true },
  });
  const event = await prisma.event.update({
    data: { current: true },
    where: { id: eventId },
  });

  return res.json(event);
}
