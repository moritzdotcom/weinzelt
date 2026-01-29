import sendReservationCancelMail from '@/lib/mailer/reservationCancelMail';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

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
  const { reason } = req.body;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      seating: {
        select: {
          timeslot: true,
          eventDate: { select: { date: true } },
        },
      },
    },
  });

  if (!reservation)
    return res.status(404).json({ error: 'Reservation not found' });

  // Wenn bereits storniert/refunded → direkt zurück (idempotent)
  if (reservation.paymentStatus === 'CANCELED') {
    return res.json(reservation);
  }

  // 2) Refund nur wenn Zahlung existiert / bezahlt wurde
  // (Passe das an deine Status-Logik an)
  const shouldRefund = reservation.paymentStatus === 'PAID';

  let refund: { id: string; amount: number } | null = null;

  if (shouldRefund) {
    const paymentIntentId = reservation.stripePaymentIntentId;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Missing stripePaymentIntentId on reservation. Cannot refund.',
      });
    }

    refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        amount: reservation.minimumSpend, // undefined => full refund
        reason: 'requested_by_customer', // Stripe enum; optional
        metadata: {
          reservationId: reservation.id,
          cancelReason: reason ?? '',
        },
      },
      {
        // verhindert Doppel-Refunds bei Retry/Doppelklick
        idempotencyKey: `reservation_refund_${reservation.id}_${reservation.minimumSpend}`,
      },
    );
  }

  // 3) DB Update
  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      paymentStatus: 'CANCELED',
      stripeRefundId: refund?.id ?? null,
      refundedAmount: refund?.amount ?? null,
      refundReason: reason ?? null,
      canceledAt: new Date(),
    },
    include: {
      seating: {
        select: {
          timeslot: true,
          eventDate: { select: { date: true } },
        },
      },
    },
  });

  // 4) Mail
  await sendReservationCancelMail(
    updated.email,
    updated.name,
    updated.people,
    updated.seating.eventDate.date,
    updated.seating.timeslot,
    reason,
  );

  return res.json(updated);
}
