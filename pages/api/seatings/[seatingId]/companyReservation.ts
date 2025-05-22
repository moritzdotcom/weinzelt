import sendReservationConfirmationMail from '@/lib/mailer/reservationConfirmationMail';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    await handlePOST(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { seatingId } = req.query;
  if (typeof seatingId !== 'string')
    return res.status(401).json('Event required');

  const { name, companyName, email, people, budget, text } = req.body;
  if (typeof name !== 'string')
    return res.status(401).json('Invalid value for name');
  if (typeof email !== 'string')
    return res.status(401).json('Invalid value for email');
  if (typeof people !== 'number')
    return res.status(401).json('Invalid value for people');
  if (typeof budget !== 'number')
    return res.status(401).json('Invalid value for budget');

  const companyReservation = await prisma.companyReservation.create({
    data: { companyName, name, email, people, budget, text, seatingId },
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
    companyReservation.seating.eventDate.date,
    companyReservation.seating.timeslot
  );

  return res.json(companyReservation);
}
