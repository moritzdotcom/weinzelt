import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import prisma from '@/lib/prismadb';
import { determineMinimumSpend, determineTableCount } from '@/lib/reservation';
import { createNewsletterSubscription } from '@/lib/newsletter';
import { createStripeSession } from '@/lib/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      type,
      name,
      email,
      people,
      seatingId,
      referralCodeId,
      billingAddress,
      shippingAddress,
      shippingSameAsBilling,
      newsletter,
    } = req.body;

    const reservationType = type == 'STANDING' ? 'STANDING' : 'VIP';
    if (typeof name !== 'string' || name.length == 0)
      return res.status(401).json('Ungültiger Name');
    if (typeof email !== 'string' || email.length == 0)
      return res.status(401).json('Ungültige Email');
    if (typeof people !== 'number' || people < 1 || people > 100)
      return res.status(401).json('Ungültige Personenanzahl');
    if (typeof seatingId !== 'string')
      return res.status(401).json('Ungültiger Timeslot');

    const pageVisitId = req.cookies.pageVisitId;

    const seating = await prisma.seating.findUnique({
      where: { id: seatingId },
      select: {
        id: true,
        minimumSpendVip: true,
        minimumSpendStanding: true,
        timeslot: true,
        eventDate: {
          select: { date: true },
        },
        externalTicketConfig: true,
      },
    });

    if (!seating) return res.status(404).json({ error: 'Seating not found' });

    const tableCount = determineTableCount(people);
    const minimumSpend = determineMinimumSpend(type, people, seating);
    const ticketCfg = seating.externalTicketConfig;
    const ticketFeeEuro = ticketCfg
      ? ticketCfg.ticketPerPerson
        ? people * ticketCfg.ticketPrice
        : ticketCfg.ticketPrice
      : 0;

    // Reservation anlegen (oder du nutzt ein bestehendes Draft)
    const reservation = await prisma.reservation.create({
      data: {
        type: reservationType,
        name,
        email,
        people,
        seatingId,
        pageVisitId,
        referralCodeId,
        tableCount,
        paymentStatus: 'PENDING_PAYMENT',
        minimumSpend,
        externalTicketPrice: ticketFeeEuro,
        billingAddress,
        shippingAddress,
        shippingSameAsBilling: Boolean(shippingSameAsBilling),
      },
      include: {
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

    if (newsletter) {
      await createNewsletterSubscription(email, name);
    }

    const session = await createStripeSession(
      people,
      type,
      seating,
      email,
      reservation.id,
    );

    // Session ID speichern (optional aber hilfreich)
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
