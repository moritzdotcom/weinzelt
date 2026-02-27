import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import prisma from '@/lib/prismadb';
import sendReservationMail from '@/lib/mailer/reservationMail';
import sendReservationCancelMail from '@/lib/mailer/reservationCancelMail';
import { getShippingAddressFromReservation } from '@/lib/reservation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export const config = {
  api: { bodyParser: false },
};

async function buffer(readable: any) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable)
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

function getReservationIdFromSession(session: Stripe.Checkout.Session) {
  return session.metadata?.reservationId ?? null;
}

function getReservationIdFromPaymentIntent(pi: Stripe.PaymentIntent) {
  // Wenn du bei create checkout session auch payment_intent_data.metadata setzt,
  // kannst du es hier direkt ziehen. Falls nicht, kannst du über DB Lookup per stripePaymentIntentId gehen.
  return (pi.metadata as any)?.reservationId ?? null;
}

async function markPaidAndSendMail(
  reservationId: string,
  stripePaymentIntentId?: string | null,
) {
  // Reservation + benötigte Daten fürs Mailing holen
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      id: true,
      paymentStatus: true,
      email: true,
      name: true,
      people: true,
      seating: {
        select: { timeslot: true, eventDate: { select: { date: true } } },
      },
      shippingAddress: true,
      billingAddress: true,
      shippingSameAsBilling: true,
    },
  });

  if (!reservation) {
    console.warn(
      '[stripe-webhook] Reservation not found for markPaid:',
      reservationId,
    );
    return;
  }

  // Idempotenz: nur wenn nicht schon PAID
  if (reservation.paymentStatus === 'PAID') return;

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      paymentStatus: 'PAID',
      payed: true,
      paidAt: new Date(),
      stripePaymentIntentId: stripePaymentIntentId ?? undefined,
      notified: new Date(),
    },
  });

  const shippingAddress = getShippingAddressFromReservation(reservation);

  // Mail nur einmal (weil wir nur beim Statuswechsel senden)
  await sendReservationMail(
    reservation.email,
    reservation.name,
    String(reservation.people),
    reservation.seating.eventDate.date,
    reservation.seating.timeslot,
    shippingAddress,
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).send('Missing stripe-signature');

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      /**
       * 1) Checkout abgeschlossen (aber nicht immer final bezahlt)
       */
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const reservationId = getReservationIdFromSession(session);
        if (!reservationId) {
          console.warn(
            '[stripe-webhook] Missing reservationId in session metadata',
            { sessionId: session.id },
          );
          break;
        }

        // Optional: Verifikation der Summe
        const amountTotal = session.amount_total ?? null;

        const reservation = await prisma.reservation.findUnique({
          where: { id: reservationId },
          select: {
            id: true,
            paymentStatus: true,
            minimumSpend: true,
          },
        });

        if (!reservation) {
          console.warn(
            '[stripe-webhook] Reservation not found:',
            reservationId,
          );
          break;
        }

        const totalCents = reservation.minimumSpend * 100;
        if (amountTotal !== null && amountTotal !== totalCents) {
          console.warn('[stripe-webhook] Amount mismatch', {
            amountTotal,
            expected: totalCents,
            reservationId,
            sessionId: session.id,
          });
        }

        // IDs immer speichern
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null;

        // payment_status ist bei Checkout Sessions der beste Indikator:
        // - 'paid' => du kannst direkt auf PAID gehen (z.B. Kreditkarte)
        // - 'unpaid' => async, später kommt async_payment_succeeded oder payment_intent.succeeded
        // - 'no_payment_required' => 0€ / free
        const paymentStatus = session.payment_status;

        await prisma.reservation.update({
          where: { id: reservationId },
          data: {
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            // Status NICHT blind auf PAID setzen:
            paymentStatus:
              paymentStatus === 'paid' ||
              paymentStatus === 'no_payment_required'
                ? 'PAID'
                : 'PENDING_PAYMENT',
          },
        });

        // Wenn wirklich paid/no_payment_required: Finalisieren + Mail (idempotent)
        if (
          paymentStatus === 'paid' ||
          paymentStatus === 'no_payment_required'
        ) {
          await markPaidAndSendMail(reservationId, paymentIntentId);
        }

        break;
      }

      /**
       * 2) Async Payment später erfolgreich (SEPA/Klarna/...)
       */
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;

        const reservationId = getReservationIdFromSession(session);
        if (!reservationId) {
          console.warn(
            '[stripe-webhook] Missing reservationId in async_payment_succeeded',
            { sessionId: session.id },
          );
          break;
        }

        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null;

        // session ist jetzt wirklich bezahlt
        await prisma.reservation.update({
          where: { id: reservationId },
          data: {
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
          },
        });

        await markPaidAndSendMail(reservationId, paymentIntentId);
        break;
      }

      /**
       * 3) Async Payment fehlgeschlagen (SEPA/Klarna/...)
       */
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const reservationId = getReservationIdFromSession(session);
        if (!reservationId) {
          console.warn(
            '[stripe-webhook] Missing reservationId in async_payment_failed',
            { sessionId: session.id },
          );
          break;
        }

        const reservation = await prisma.reservation.update({
          where: { id: reservationId },
          data: {
            paymentStatus: 'CANCELED',
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            people: true,
            seating: {
              select: { timeslot: true, eventDate: { select: { date: true } } },
            },
          },
        });

        await sendReservationCancelMail(
          reservation.email,
          reservation.name,
          reservation.people,
          reservation.seating.eventDate.date,
          reservation.seating.timeslot,
          'Zahlung fehlgeschlagen',
        );

        break;
      }

      /**
       * 4) PaymentIntent succeeded (kommt typischerweise bei Karten-Zahlung)
       *    -> absolut final "paid"
       */
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;

        // 1) versuche ReservationId aus PI metadata (wenn du sie dort setzt)
        const metaReservationId = getReservationIdFromPaymentIntent(pi);

        if (metaReservationId) {
          await markPaidAndSendMail(metaReservationId, pi.id);
          break;
        }

        // 2) fallback: Reservation über gespeicherte stripePaymentIntentId finden
        const reservation = await prisma.reservation.findFirst({
          where: { stripePaymentIntentId: pi.id },
          select: { id: true },
        });

        if (!reservation) {
          console.warn(
            '[stripe-webhook] No reservation found for payment_intent:',
            pi.id,
          );
          break;
        }

        await markPaidAndSendMail(reservation.id, pi.id);
        break;
      }

      /**
       * 5) Refund / Charge refunded
       *    -> Status auf REFUNDED setzen
       */
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;

        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : null;

        if (!paymentIntentId) {
          console.warn(
            '[stripe-webhook] charge.refunded without payment_intent',
            { chargeId: charge.id },
          );
          break;
        }

        const reservation = await prisma.reservation.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
          select: {
            id: true,
            paymentStatus: true,
            email: true,
            name: true,
            people: true,
            seating: {
              select: { timeslot: true, eventDate: { select: { date: true } } },
            },
          },
        });

        if (!reservation) {
          console.warn(
            '[stripe-webhook] No reservation found for refunded PI:',
            paymentIntentId,
          );
          break;
        }

        await prisma.reservation.update({
          where: { id: reservation.id },
          data: {
            paymentStatus: 'CANCELED',
          },
        });

        await sendReservationCancelMail(
          reservation.email,
          reservation.name,
          reservation.people,
          reservation.seating.eventDate.date,
          reservation.seating.timeslot,
          'Rückerstattung durchgeführt',
        );

        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return res.status(500).send('Webhook handler failed');
  }
}
