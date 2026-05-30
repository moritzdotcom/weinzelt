import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prismadb';

class RegistrationError extends Error {
  constructor(
    public code:
      | 'EVENT_NOT_FOUND'
      | 'REGISTRATION_DISABLED'
      | 'SOLD_OUT'
      | 'TOO_MANY_PERSONS',
  ) {
    super(code);
  }
}

async function createRegistrationWithRetry(params: {
  specialEventId: string;
  name: string;
  email: string;
  phone?: string;
  personCount: number;
}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const event = await tx.specialEvent.findUnique({
            where: {
              id: params.specialEventId,
            },
            select: {
              id: true,
              isPublished: true,
              bookingType: true,
              capacity: true,
              maxPersonsPerRegistration: true,
            },
          });

          if (!event || !event.isPublished) {
            throw new RegistrationError('EVENT_NOT_FOUND');
          }

          if (event.bookingType !== 'INTERNAL_REGISTRATION') {
            throw new RegistrationError('REGISTRATION_DISABLED');
          }

          if (params.personCount > event.maxPersonsPerRegistration) {
            throw new RegistrationError('TOO_MANY_PERSONS');
          }

          if (event.capacity !== null) {
            const aggregate = await tx.eventRegistration.aggregate({
              where: {
                specialEventId: event.id,
                status: 'REGISTERED',
              },
              _sum: {
                personCount: true,
              },
            });

            const currentPersonCount = aggregate._sum.personCount ?? 0;

            if (currentPersonCount + params.personCount > event.capacity) {
              throw new RegistrationError('SOLD_OUT');
            }
          }

          return tx.eventRegistration.create({
            data: {
              specialEventId: event.id,
              name: params.name,
              email: params.email.toLowerCase(),
              phone: params.phone || null,
              personCount: params.personCount,
            },
            select: {
              id: true,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      const shouldRetry =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034';

      if (!shouldRetry || attempt === 2) {
        throw error;
      }
    }
  }

  throw new Error('Registration failed');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ id: string } | { error: string }>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const specialEventId = String(req.query.specialEventId);

  try {
    const payload = req.body;

    const registration = await createRegistrationWithRetry({
      specialEventId,
      ...payload,
    });

    return res.status(201).json({
      id: registration.id,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof RegistrationError) {
      switch (error.code) {
        case 'EVENT_NOT_FOUND':
          return res.status(404).json({
            error: 'Dieses WineEvent ist nicht mehr verfügbar.',
          });

        case 'REGISTRATION_DISABLED':
          return res.status(400).json({
            error: 'Für dieses WineEvent ist keine interne Anmeldung möglich.',
          });

        case 'SOLD_OUT':
          return res.status(409).json({
            error: 'Leider sind nicht mehr genügend Plätze verfügbar.',
          });

        case 'TOO_MANY_PERSONS':
          return res.status(400).json({
            error: 'Die ausgewählte Gruppengröße ist für dieses Event zu groß.',
          });
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return res.status(409).json({
        error:
          'Mit dieser E-Mail-Adresse wurde bereits eine Anmeldung vorgenommen.',
      });
    }

    return res.status(500).json({
      error: 'Die Anmeldung konnte nicht gespeichert werden.',
    });
  }
}
