import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  const { reservationId } = req.query;
  if (typeof reservationId !== 'string')
    return res.status(401).json('Reservation required');

  if (req.method === 'PUT') {
    await handlePUT(req, res, reservationId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiPutReservationResponse = {
  name: string;
  id: string;
  email: string;
  people: number;
  seatingId: string;
  confirmed: boolean;
  packageName: string;
  packageDescription: string;
  packagePrice: number;
  tableNumber: string | null;
};

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { confirmationState, tableNumber } = req.body;

  const reservation = await prisma.reservation.update({
    data: { confirmationState, tableNumber },
    where: { id },
  });

  return res.json(reservation);
}
