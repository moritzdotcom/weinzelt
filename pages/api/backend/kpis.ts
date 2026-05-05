import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    await handleGET(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

export type BackendKpisResponse = {
  occupancyRate: number;
  confirmedGuests: number;
  reservedMinimumSpend: number;
  manualInvoicesOpen: number;
};

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const event = await prisma.event.findFirst({
    where: { current: true },
    select: {
      eventDates: {
        select: {
          seatings: {
            select: {
              availableStanding: true,
              availableVip: true,
              reservations: {
                where: {
                  paymentStatus: { in: ['PENDING_PAYMENT', 'PAID'] },
                },
                select: {
                  people: true,
                  minimumSpend: true,
                  paymentStatus: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!event)
    return res.status(200).json({
      occupancyRate: 0,
      confirmedGuests: 0,
      reservedMinimumSpend: 0,
      manualInvoicesOpen: 0,
    });

  const availableSeatings = event.eventDates.reduce((prev, curr) => {
    return (
      prev +
      curr.seatings.reduce(
        (a, b) => a + b.availableStanding + b.availableVip,
        0,
      )
    );
  }, 0);
  const reservationCount = event.eventDates.reduce((prev, curr) => {
    return prev + curr.seatings.reduce((a, b) => a + b.reservations.length, 0);
  }, 0);
  const occupancyRate = Math.round(
    (reservationCount * 100) / availableSeatings,
  );

  const confirmedGuests = event.eventDates.reduce((prev, curr) => {
    return (
      prev +
      curr.seatings.reduce(
        (a, b) => a + b.reservations.reduce((p, c) => p + c.people, 0),
        0,
      )
    );
  }, 0);

  const reservedMinimumSpend = event.eventDates.reduce((prev, curr) => {
    return (
      prev +
      curr.seatings.reduce(
        (a, b) =>
          a +
          b.reservations
            .filter((r) => r.paymentStatus === 'PAID')
            .reduce((p, c) => p + c.minimumSpend, 0),
        0,
      )
    );
  }, 0);

  const manualInvoicesOpen = event.eventDates.reduce((prev, curr) => {
    return (
      prev +
      curr.seatings.reduce(
        (a, b) =>
          a +
          b.reservations.filter((r) => r.paymentStatus === 'PENDING_PAYMENT')
            .length,
        0,
      )
    );
  }, 0);

  return res.status(200).json({
    occupancyRate,
    confirmedGuests,
    reservedMinimumSpend,
    manualInvoicesOpen,
  });
}
