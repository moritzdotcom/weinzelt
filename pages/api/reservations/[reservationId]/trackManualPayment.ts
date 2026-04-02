import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { reservationId } = req.query;
  if (typeof reservationId !== 'string')
    return res.status(401).json('Reservation required');

  if (req.method === 'POST') {
    await handlePOST(req, res, reservationId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  const reservation = await prisma.reservation.update({
    data: {
      paymentStatus: 'PAID',
      paidAt: new Date(),
      manualPaymentTrackedBy: session.name,
    },
    where: { id },
  });

  return res.json(reservation);
}
