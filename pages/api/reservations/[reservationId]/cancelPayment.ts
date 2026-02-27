import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const id = String(req.query.reservationId || '');
  if (!id) return res.status(400).json({ error: 'Missing id' });

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: { id: true, paymentStatus: true },
  });

  if (!reservation) return res.status(404).json({ error: 'Not found' });

  // Wenn schon bezahlt: nicht canceln
  if (reservation.paymentStatus === 'PAID') {
    return res.status(409).json({ error: 'Reservation already paid' });
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { paymentStatus: 'CANCELED' },
    select: { id: true, paymentStatus: true },
  });

  return res.status(200).json({ reservation: updated });
}
