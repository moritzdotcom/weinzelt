import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import prisma from '@/lib/prismadb';
import { createStripeSession } from '@/lib/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

type Body = { reservationId: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { reservationId } = req.body as Body;
  if (!reservationId)
    return res.status(400).json({ error: 'Missing reservationId' });

  const r = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      id: true,
      paymentStatus: true,
      type: true,
      people: true,
      tableCount: true,
      minimumSpend: true,
      email: true,
      seating: {
        select: {
          id: true,
          minimumSpendVip: true,
          minimumSpendStanding: true,
          externalTicketConfig: true,
          timeslot: true,
          eventDate: {
            select: {
              date: true,
            },
          },
        },
      },
    },
  });

  if (!r) return res.status(404).json({ error: 'Not found' });
  if (r.paymentStatus === 'PAID')
    return res.status(409).json({ error: 'Already paid' });

  const session = await createStripeSession(
    r.people,
    r.type,
    r.seating,
    r.email,
    r.id,
  );

  return res.status(200).json({ url: session.url });
}
