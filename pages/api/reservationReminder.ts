import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  const reservationReminders = await prisma.reservationReminder.findMany();
  return res.json(reservationReminders);
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { name, email } = req.body;
  if (!name) return res.status(401).json('Name required');
  if (!email) return res.status(401).json('Email required');

  const reminder = await prisma.reservationReminder.create({
    data: { name, email },
  });

  return res.json(reminder);
}
