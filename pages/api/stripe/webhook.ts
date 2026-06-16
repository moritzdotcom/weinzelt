import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import prisma from '@/lib/prismadb';
import sendReservationMail from '@/lib/mailer/reservationMail';
import sendReservationCancelMail from '@/lib/mailer/reservationCancelMail';
import { getShippingAddressFromReservation } from '@/lib/reservation';
import { createAndSendReservationInvoice } from '@/lib/reservationInvoice';
import sendSpecialEventConfirmationMail from '@/lib/mailer/specialEventConfirmationMail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export const config = {
  api: { bodyParser: false },
};

type StripeFlowType = 'RESERVATION' | 'SPECIAL_EVENT';

async function buffer(readable: any) {
  const chunks: Buffer[] = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

function getPaymentIntentIdFromSession(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === 'string'
    ? session.payment_intent
    : null;
}

function getFlowTypeFromMetadata(
  metadata?: Stripe.Metadata | null,
): StripeFlowType | null {
  const type = metadata?.model;

  if (type === 'RESERVATION') return 'RESERVATION';
  if (type === 'SPECIAL_EVENT') {
    return 'SPECIAL_EVENT';
  }

  return null;
}

function getReservationIdFromMetadata(metadata?: Stripe.Metadata | null) {
  return metadata?.reservationId ?? null;
}

function getSpecialEventRegistrationIdFromMetadata(
  metadata?: Stripe.Metadata | null,
) {
  return metadata?.registrationId ?? null;
}

async function markReservationPaidAndSendMail(
  reservationId: string,
  stripePaymentIntentId?: string | null,
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      id: true,
      paymentStatus: true,
      email: true,
      name: true,
      people: true,
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
      shippingAddress: true,
      billingAddress: true,
      shippingSameAsBilling: true,
    },
  });

  if (!reservation) {
    console.warn('[stripe-webhook] Reservation not found for markPaid', {
      reservationId,
    });
    return;
  }

  if (reservation.paymentStatus === 'PAID') {
    return;
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      paymentStatus: 'PAID',
      paidAt: new Date(),
      stripePaymentIntentId: stripePaymentIntentId ?? undefined,
      notified: new Date(),
    },
  });

  const shippingAddress = getShippingAddressFromReservation(reservation);

  await sendReservationMail(
    reservation.email,
    reservation.name,
    String(reservation.people),
    reservation.seating.eventDate.date,
    reservation.seating.timeslot,
    shippingAddress,
  );

  await createAndSendReservationInvoice(reservationId);
}

async function markSpecialEventRegistrationPaidAndSendMail(params: {
  registrationId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}) {
  const existingRegistration = await prisma.eventRegistration.findUnique({
    where: {
      id: params.registrationId,
    },
    select: {
      id: true,
      status: true,
      paidAt: true,
    },
  });

  if (!existingRegistration) {
    console.warn('[stripe-webhook] SpecialEvent registration not found', {
      registrationId: params.registrationId,
    });
    return;
  }

  if (existingRegistration.status === 'REGISTERED') {
    return;
  }

  const registration = await prisma.eventRegistration.update({
    where: {
      id: params.registrationId,
    },
    data: {
      status: 'REGISTERED',
      paidAt: new Date(),
      stripeCheckoutSessionId: params.stripeCheckoutSessionId ?? undefined,
      stripePaymentIntentId: params.stripePaymentIntentId ?? undefined,
    },
    select: {
      id: true,
      email: true,
      name: true,
      personCount: true,
      specialEvent: {
        select: {
          name: true,
          startTime: true,
          eventDate: true,
        },
      },
    },
  });

  await sendSpecialEventConfirmationMail(
    registration.email,
    registration.specialEvent.name,
    registration.name,
    registration.personCount,
    registration.specialEvent.eventDate.date,
    registration.specialEvent.startTime,
  );
}

async function handleReservationCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  const reservationId = getReservationIdFromMetadata(session.metadata);

  if (!reservationId) {
    console.warn('[stripe-webhook] Missing reservationId in session metadata', {
      sessionId: session.id,
    });
    return;
  }

  const amountTotal = session.amount_total ?? null;

  const reservation = await prisma.reservation.findUnique({
    where: {
      id: reservationId,
    },
    select: {
      id: true,
      paymentStatus: true,
      minimumSpend: true,
    },
  });

  if (!reservation) {
    console.warn('[stripe-webhook] Reservation not found', {
      reservationId,
      sessionId: session.id,
    });
    return;
  }

  const expectedTotalCents = reservation.minimumSpend * 100;

  if (amountTotal !== null && amountTotal !== expectedTotalCents) {
    console.warn('[stripe-webhook] Reservation amount mismatch', {
      amountTotal,
      expected: expectedTotalCents,
      reservationId,
      sessionId: session.id,
    });
  }

  const paymentIntentId = getPaymentIntentIdFromSession(session);
  const paymentStatus = session.payment_status;

  await prisma.reservation.update({
    where: {
      id: reservationId,
    },
    data: {
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      paymentStatus:
        paymentStatus === 'paid' || paymentStatus === 'no_payment_required'
          ? 'PAID'
          : 'PENDING_PAYMENT',
    },
  });

  if (paymentStatus === 'paid' || paymentStatus === 'no_payment_required') {
    await markReservationPaidAndSendMail(reservationId, paymentIntentId);
  }
}

async function handleSpecialEventCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  const registrationId = getSpecialEventRegistrationIdFromMetadata(
    session.metadata,
  );

  if (!registrationId) {
    console.warn(
      '[stripe-webhook] Missing registrationId in SpecialEvent session metadata',
      {
        sessionId: session.id,
      },
    );
    return;
  }

  const paymentIntentId = getPaymentIntentIdFromSession(session);
  const paymentStatus = session.payment_status;

  await prisma.eventRegistration.update({
    where: {
      id: registrationId,
    },
    data: {
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      ...(paymentStatus === 'paid' || paymentStatus === 'no_payment_required'
        ? {}
        : { status: 'PENDING_PAYMENT' as const }),
    },
  });

  if (paymentStatus === 'paid' || paymentStatus === 'no_payment_required') {
    await markSpecialEventRegistrationPaidAndSendMail({
      registrationId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
    });
  }
}

async function handleReservationAsyncPaymentSucceeded(
  session: Stripe.Checkout.Session,
) {
  const reservationId = getReservationIdFromMetadata(session.metadata);

  if (!reservationId) {
    console.warn(
      '[stripe-webhook] Missing reservationId in async_payment_succeeded',
      {
        sessionId: session.id,
      },
    );
    return;
  }

  const paymentIntentId = getPaymentIntentIdFromSession(session);

  await prisma.reservation.update({
    where: {
      id: reservationId,
    },
    data: {
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
    },
  });

  await markReservationPaidAndSendMail(reservationId, paymentIntentId);
}

async function handleSpecialEventAsyncPaymentSucceeded(
  session: Stripe.Checkout.Session,
) {
  const registrationId = getSpecialEventRegistrationIdFromMetadata(
    session.metadata,
  );

  if (!registrationId) {
    console.warn(
      '[stripe-webhook] Missing registrationId in SpecialEvent async_payment_succeeded',
      {
        sessionId: session.id,
      },
    );
    return;
  }

  await markSpecialEventRegistrationPaidAndSendMail({
    registrationId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: getPaymentIntentIdFromSession(session),
  });
}

async function handleReservationAsyncPaymentFailed(
  session: Stripe.Checkout.Session,
) {
  const reservationId = getReservationIdFromMetadata(session.metadata);

  if (!reservationId) {
    console.warn(
      '[stripe-webhook] Missing reservationId in async_payment_failed',
      {
        sessionId: session.id,
      },
    );
    return;
  }

  const reservation = await prisma.reservation.update({
    where: {
      id: reservationId,
    },
    data: {
      paymentStatus: 'CANCELED',
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: getPaymentIntentIdFromSession(session),
    },
    select: {
      id: true,
      email: true,
      name: true,
      people: true,
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

  await sendReservationCancelMail(
    reservation.email,
    reservation.name,
    reservation.people,
    reservation.seating.eventDate.date,
    reservation.seating.timeslot,
    'Zahlung fehlgeschlagen',
  );
}

async function handleSpecialEventAsyncPaymentFailed(
  session: Stripe.Checkout.Session,
) {
  const registrationId = getSpecialEventRegistrationIdFromMetadata(
    session.metadata,
  );

  if (!registrationId) {
    console.warn(
      '[stripe-webhook] Missing registrationId in SpecialEvent async_payment_failed',
      {
        sessionId: session.id,
      },
    );
    return;
  }

  await prisma.eventRegistration.update({
    where: {
      id: registrationId,
    },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: getPaymentIntentIdFromSession(session),
    },
  });
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  const flowType = getFlowTypeFromMetadata(session.metadata);

  if (flowType === 'SPECIAL_EVENT') {
    await handleSpecialEventCheckoutCompleted(session);
    return;
  }

  if (flowType === 'RESERVATION' || session.metadata?.reservationId) {
    await handleReservationCheckoutCompleted(session);
    return;
  }

  console.info('[stripe-webhook] Ignored checkout.session.completed', {
    sessionId: session.id,
    metadata: session.metadata,
  });
}

async function handleCheckoutSessionAsyncPaymentSucceeded(
  session: Stripe.Checkout.Session,
) {
  const flowType = getFlowTypeFromMetadata(session.metadata);

  if (flowType === 'SPECIAL_EVENT') {
    await handleSpecialEventAsyncPaymentSucceeded(session);
    return;
  }

  if (flowType === 'RESERVATION' || session.metadata?.reservationId) {
    await handleReservationAsyncPaymentSucceeded(session);
    return;
  }

  console.info('[stripe-webhook] Ignored async_payment_succeeded', {
    sessionId: session.id,
    metadata: session.metadata,
  });
}

async function handleCheckoutSessionAsyncPaymentFailed(
  session: Stripe.Checkout.Session,
) {
  const flowType = getFlowTypeFromMetadata(session.metadata);

  if (flowType === 'SPECIAL_EVENT') {
    await handleSpecialEventAsyncPaymentFailed(session);
    return;
  }

  if (flowType === 'RESERVATION' || session.metadata?.reservationId) {
    await handleReservationAsyncPaymentFailed(session);
    return;
  }

  console.info('[stripe-webhook] Ignored async_payment_failed', {
    sessionId: session.id,
    metadata: session.metadata,
  });
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const flowType = getFlowTypeFromMetadata(pi.metadata);

  if (flowType === 'SPECIAL_EVENT') {
    const registrationId = getSpecialEventRegistrationIdFromMetadata(
      pi.metadata,
    );

    if (!registrationId) {
      console.warn(
        '[stripe-webhook] Missing registrationId in SpecialEvent PaymentIntent metadata',
        {
          paymentIntentId: pi.id,
        },
      );
      return;
    }

    await markSpecialEventRegistrationPaidAndSendMail({
      registrationId,
      stripePaymentIntentId: pi.id,
    });

    return;
  }

  if (flowType === 'RESERVATION') {
    const reservationId = getReservationIdFromMetadata(pi.metadata);

    if (!reservationId) {
      console.warn(
        '[stripe-webhook] Missing reservationId in Reservation PaymentIntent metadata',
        {
          paymentIntentId: pi.id,
        },
      );
      return;
    }

    await markReservationPaidAndSendMail(reservationId, pi.id);
    return;
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      stripePaymentIntentId: pi.id,
    },
    select: {
      id: true,
    },
  });

  if (reservation) {
    await markReservationPaidAndSendMail(reservation.id, pi.id);
    return;
  }

  const registration = await prisma.eventRegistration.findFirst({
    where: {
      stripePaymentIntentId: pi.id,
    },
    select: {
      id: true,
    },
  });

  if (registration) {
    await markSpecialEventRegistrationPaidAndSendMail({
      registrationId: registration.id,
      stripePaymentIntentId: pi.id,
    });
    return;
  }

  console.info('[stripe-webhook] Ignored payment_intent.succeeded', {
    paymentIntentId: pi.id,
    metadata: pi.metadata,
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : null;

  if (!paymentIntentId) {
    console.warn('[stripe-webhook] charge.refunded without payment_intent', {
      chargeId: charge.id,
    });
    return;
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      stripePaymentIntentId: paymentIntentId,
    },
    select: {
      id: true,
      paymentStatus: true,
      email: true,
      name: true,
      people: true,
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

  if (reservation) {
    await prisma.reservation.update({
      where: {
        id: reservation.id,
      },
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

    return;
  }

  const registration = await prisma.eventRegistration.findFirst({
    where: {
      stripePaymentIntentId: paymentIntentId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (registration) {
    await prisma.eventRegistration.update({
      where: {
        id: registration.id,
      },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    return;
  }

  console.info('[stripe-webhook] Ignored charge.refunded', {
    chargeId: charge.id,
    paymentIntentId,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).send('Missing stripe-signature');
  }

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
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        await handleCheckoutSessionAsyncPaymentSucceeded(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }

      case 'checkout.session.async_payment_failed': {
        await handleCheckoutSessionAsyncPaymentFailed(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }

      case 'payment_intent.succeeded': {
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      }

      case 'charge.refunded': {
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return res.status(500).send('Webhook handler failed');
  }
}
