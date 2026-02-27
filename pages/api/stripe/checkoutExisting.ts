import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import prisma from '@/lib/prismadb';

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

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    locale: 'de',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name:
              r.type === 'VIP'
                ? 'Weinzelt VIP Mindestverzehr'
                : 'Weinzelt Mindestverzehr',
            description: `${r.tableCount} Tisch${
              r.tableCount > 1 ? 'e' : ''
            } · Seating ${new Date(r.seating.eventDate.date).toLocaleDateString(
              'de-DE',
            )} ${r.seating.timeslot}`,
          },
          unit_amount: (r.minimumSpend / r.tableCount) * 100,
        },
        quantity: r.tableCount,
      },
    ],
    customer_email: r.email,
    metadata: {
      reservationId: r.id,
      expectedTotalCents: r.minimumSpend * 100,
    },
    payment_intent_data: {
      metadata: {
        reservationId: r.id,
      },
    },
    success_url: `${process.env.APP_URL}/reservation/success?rid=${r.id}`,
    cancel_url: `${process.env.APP_URL}/reservation/cancel?rid=${r.id}`,
  });

  return res.status(200).json({ url: session.url });
}
