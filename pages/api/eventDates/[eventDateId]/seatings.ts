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

export type ApiPostSeatingResponse = {
  eventDateId: string;
  id: string;
  timeslot: string;
  availableVip: number;
  availableStanding: number;
  foodRequired: boolean;
  availablePackageIds: number[];
  minimumSpend: number;
  minimumSpendVip: number;
  minimumSpendStanding: number;
};

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const {
    availableVip,
    availableStanding,
    foodRequired,
    timeslot,
    minimumSpend,
    minimumSpendVip,
    minimumSpendStanding,
  } = req.body;
  if (typeof availableVip !== 'number')
    return res.status(401).json('Availability Required');
  if (typeof availableStanding !== 'number')
    return res.status(401).json('Availability Required');
  if (typeof foodRequired !== 'boolean')
    return res.status(401).json('FoodRequired Required');
  if (typeof timeslot !== 'string')
    return res.status(401).json('Timeslot Required');

  const seating = await prisma.seating.create({
    data: {
      availableVip,
      availableStanding,
      foodRequired,
      timeslot,
      eventDateId: id,
      minimumSpend,
      minimumSpendVip,
      minimumSpendStanding,
    },
  });

  return res.json(seating);
}
