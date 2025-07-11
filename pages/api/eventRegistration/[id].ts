import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  const { id } = req.query;
  if (typeof id !== 'string') return res.status(401).json('Event required');

  if (req.method === 'DELETE') {
    await handleDELETE(req, res, id);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

async function handleDELETE(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  await prisma.eventRegistration.delete({ where: { id } });
  return res.json('OK');
}
