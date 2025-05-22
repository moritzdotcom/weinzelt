import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { Prisma } from '@prisma/client';
import { validatePackage } from '@/lib/packages';
import sendReservationConfirmationMail from '@/lib/mailer/reservationConfirmationMail';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    await handleGET(req, res);
  } else if (req.method === 'POST') {
    await handlePOST(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetReservationDataResponse = Prisma.EventGetPayload<{
  select: {
    eventDates: {
      select: {
        date: true;
        dow: true;
        seatings: {
          select: {
            id: true;
            availableVip: true;
            availableStanding: true;
            timeslot: true;
            availablePackageIds: true;
            foodRequired: true;
            minimumSpend: true;
            reservations: { select: { tableCount: true; type: true } };
          };
        };
      };
    };
  };
}>;

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const reservations = await prisma.event.findFirst({
    where: { current: true },
    select: {
      eventDates: {
        select: {
          date: true,
          dow: true,
          seatings: {
            select: {
              id: true,
              availableVip: true,
              availableStanding: true,
              timeslot: true,
              availablePackageIds: true,
              foodRequired: true,
              minimumSpend: true,
              reservations: {
                where: {
                  confirmationState: 'ACCEPTED',
                },
                select: { tableCount: true, type: true },
              },
            },
          },
        },
      },
    },
  });

  if (!reservations) return res.status(404).json('No Event Found');

  return res.json(reservations);
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const {
    type,
    name,
    email,
    packageName,
    packageDescription,
    packagePrice,
    people,
    seatingId,
    foodCountMeat,
    foodCountFish,
    foodCountVegetarian,
  } = req.body;

  const reservationType = type == 'STANDING' ? 'STANDING' : 'VIP';
  if (typeof name !== 'string' || name.length == 0)
    return res.status(401).json('Ungültiger Name');
  if (typeof email !== 'string' || email.length == 0)
    return res.status(401).json('Ungültige Email');
  if (
    reservationType == 'VIP' &&
    !validatePackage(packageName, packageDescription, packagePrice)
  )
    return res.status(401).json('Ungültiges Package');
  if (typeof people !== 'number' || people < 1)
    return res.status(401).json('Ungültige Personenanzahl');
  if (typeof seatingId !== 'string')
    return res.status(401).json('Ungültiger Timeslot');

  const reservation = await prisma.reservation.create({
    data: {
      type: reservationType,
      name,
      email,
      packageName,
      packageDescription,
      packagePrice,
      people,
      seatingId,
      foodCountMeat,
      foodCountFish,
      foodCountVegetarian,
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

  await sendReservationConfirmationMail(
    email,
    name,
    people,
    reservation.seating.eventDate.date,
    reservation.seating.timeslot
  );

  return res.json(reservation);
}
