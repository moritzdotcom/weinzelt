import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  const { seatingId } = req.query;
  if (typeof seatingId !== 'string')
    return res.status(401).json('Event required');

  if (req.method === 'PUT') {
    await handlePUT(req, res, seatingId);
  } else if (req.method === 'DELETE') {
    await handleDELETE(req, res, seatingId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiPutSeatingResponse = {
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

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const {
    availableVip,
    availableStanding,
    foodRequired,
    timeslot,
    availablePackageIds,
    minimumSpend,
    minimumSpendVip,
    minimumSpendStanding,
  } = req.body;

  const seating = await prisma.seating.update({
    where: { id },
    data: {
      availableVip,
      availableStanding,
      foodRequired,
      timeslot,
      availablePackageIds,
      minimumSpend,
      minimumSpendVip,
      minimumSpendStanding,
    },
  });

  return res.json(seating);
}

async function handleDELETE(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  await prisma.seating.delete({
    where: { id },
  });

  return res.json('DELETED');
}
