import Stripe from 'stripe';
import { determineMinimumSpend, determineTableCount } from './reservation';
import { ReservationType } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

function createLineItems(
  people: number,
  type: ReservationType,
  seating: {
    eventDate: { date: Date | string };
    timeslot: string;
    minimumSpendVip: number;
    minimumSpendStanding: number;
    externalTicketConfig: {
      ticketPrice: number;
      ticketPerPerson: boolean;
      name: string;
    } | null;
  },
  ticketCfg: {
    ticketPrice: number;
    ticketPerPerson: boolean;
    name: string;
  } | null,
  minimumSpend: number,
  shippingCents: number,
) {
  const tableCount = determineTableCount(people);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: 'eur',
        product_data: {
          name:
            type === 'VIP'
              ? 'Weinzelt VIP Mindestverzehr'
              : 'Weinzelt Mindestverzehr',
          description: `${tableCount} Tisch${tableCount > 1 ? 'e' : ''} · Seating ${
            seating.eventDate.date
          } ${seating.timeslot}`,
        },
        unit_amount: Math.round((minimumSpend / tableCount) * 100), // EUR -> Cent
      },
      quantity: tableCount,
    },
  ];

  // Ticket-LineItem nur wenn config vorhanden
  if (ticketCfg) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Ticketgebühr - ${ticketCfg.name}`,
          description: ticketCfg.ticketPerPerson
            ? `${ticketCfg.ticketPrice}€ pro Person · Externer Veranstalter`
            : `${ticketCfg.ticketPrice}€ pro Reservierung · Externer Veranstalter`,
        },
        unit_amount: ticketCfg.ticketPrice * 100, // EUR -> Cent
      },
      quantity: ticketCfg.ticketPerPerson ? people : 1,
    });
  }

  // Versand immer
  lineItems.push({
    price_data: {
      currency: 'eur',
      product_data: {
        name: 'Versand',
        description: 'Für Einlassbändchen und Verzehrkarte',
      },
      unit_amount: shippingCents,
    },
    quantity: 1,
  });
  return lineItems;
}

export async function createStripeSession(
  people: number,
  type: ReservationType,
  seating: {
    id: string;
    eventDate: { date: Date | string };
    timeslot: string;
    minimumSpendVip: number;
    minimumSpendStanding: number;
    externalTicketConfig: {
      ticketPrice: number;
      ticketPerPerson: boolean;
      name: string;
    } | null;
  },
  email: string,
  reservationId: string,
) {
  const minimumSpend = determineMinimumSpend(type, people, seating);
  const ticketCfg = seating.externalTicketConfig;
  const ticketFeeEuro = ticketCfg
    ? ticketCfg.ticketPerPerson
      ? people * ticketCfg.ticketPrice
      : ticketCfg.ticketPrice
    : 0;
  const shippingEuro = 5.9;
  const shippingCents = shippingEuro * 100;

  return await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    locale: 'de',

    line_items: createLineItems(
      people,
      type,
      seating,
      ticketCfg,
      minimumSpend,
      shippingCents,
    ),

    // Wenn du Email hast, füllen (sonst sammelt Stripe sie ein)
    customer_email: email || undefined,

    // sehr wichtig fürs Mapping im Webhook
    metadata: {
      reservationId,
      seatingId: seating.id,
      type,
      people: String(people),
      expectedTotalCents: String(
        minimumSpend * 100 + shippingCents + ticketFeeEuro * 100,
      ),
      hasExternalTicket: ticketCfg ? 'true' : 'false',
    },
    payment_intent_data: {
      metadata: {
        reservationId,
      },
    },

    success_url: `${process.env.APP_URL}/reservation/success?rid=${reservationId}`,
    cancel_url: `${process.env.APP_URL}/reservation/cancel?rid=${reservationId}`,
  });
}
