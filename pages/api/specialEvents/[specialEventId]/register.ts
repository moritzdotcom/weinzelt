import sendSpecialEventConfirmationMail from '@/lib/mailer/specialEventConfirmationMail';
import prisma from '@/lib/prismadb';
import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { specialEventId } = req.query;
  if (typeof specialEventId !== 'string')
    return res.status(401).json('Special Event required');

  if (req.method === 'GET') {
    await handleGET(req, res, specialEventId);
  } else if (req.method === 'POST') {
    await handlePOST(req, res, specialEventId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetSpecialEventPublicResponse = Prisma.SpecialEventGetPayload<{
  include: {
    eventDate: { select: { date: true; dow: true } };
  };
}>;

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const event = await prisma.specialEvent.findUnique({
    where: { id },
    include: {
      eventDate: { select: { date: true, dow: true } },
    },
  });
  return res.json(event);
}

export type ApiPostRegisterSpecialEventResponse = {
  name: string;
  id: string;
  email: string;
  createdAt: Date;
  specialEventId: string;
  personCount: number;
};

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { name, email, personCount } = req.body;
  if (!name) return res.status(401).json('Name required');
  if (!email) return res.status(401).json('Email required');
  if (!personCount) return res.status(401).json('PersonCount required');

  const registration = await prisma.eventRegistration.create({
    data: { name, email, personCount, specialEventId: id },
    include: {
      specialEvent: {
        select: {
          name: true,
          startTime: true,
          eventDate: { select: { date: true } },
        },
      },
    },
  });

  await sendSpecialEventConfirmationMail(
    email,
    registration.specialEvent.name,
    name,
    personCount,
    registration.specialEvent.eventDate.date,
    registration.specialEvent.startTime
  );

  return res.json(registration);
}
