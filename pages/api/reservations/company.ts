import sendReservationMail from '@/lib/mailer/reservationMail';
import sendCompanyReservationMail from '@/lib/mailer/reservationMailCompany';
import prisma from '@/lib/prismadb';
import { translateType } from '@/lib/reservation';
import { getServerSession } from '@/lib/session';
import { ReservationType } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'POST') {
    await handlePOST(req, res, session.name);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

export type ApiPostReservationResponse = {
  type: ReservationType;
  name: string;
  id: string;
  email: string;
  people: number;
  seatingId: string;
  confirmed: boolean;
  minimumSpend: number;
  tableNumber: string | null;
};

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  userName: string,
) {
  const {
    type,
    name,
    email,
    people,
    tableCount,
    minimumSpend,
    seatingId,
    billingAddress,
    shippingSameAsBilling,
    shippingAddress,
    internalNotes,
  } = req.body;

  const reservationType = type == 'STANDING' ? 'STANDING' : 'VIP';
  if (typeof name !== 'string' || name.length == 0)
    return res.status(401).json('Ungültiger Name');
  if (typeof email !== 'string' || email.length == 0)
    return res.status(401).json('Ungültige Email');
  if (typeof people !== 'number' || people < 1)
    return res.status(401).json('Ungültige Personenanzahl');
  if (typeof seatingId !== 'string')
    return res.status(401).json('Ungültiger Timeslot');

  const note = internalNotes
    ? internalNotes
    : `${tableCount} ${translateType(reservationType)}${
        tableCount == 1 ? '' : 'e'
      }`;
  const reservation = await prisma.reservation.create({
    data: {
      type: reservationType,
      name,
      email,
      people,
      tableCount,
      minimumSpend,
      paymentStatus: 'PENDING_PAYMENT',
      seatingId,
      notified: new Date(),
      internalNotes: `${note} - Eingeladen von ${userName}`,
      billingAddress,
      shippingAddress,
      shippingSameAsBilling,
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

  await sendCompanyReservationMail(
    email,
    people,
    reservation.seating.eventDate.date,
    reservation.seating.timeslot,
    shippingAddress,
  );

  return res.json(reservation);
}
