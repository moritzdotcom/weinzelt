// pages/api/specialEvents/[specialEventId]/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prismadb';
import { createNewsletterSubscription } from '@/lib/newsletter';
import sendSpecialEventConfirmationMail from '@/lib/mailer/specialEventConfirmationMail';
import { createSpecialEventStripeSession } from '@/lib/stripe';

export type ApiPostSpecialEventRegisterResponse =
  | { id: string; requiresPayment: false }
  | { url: string; requiresPayment: true }
  | { error: string };

class RegistrationError extends Error {
  constructor(
    public code:
      | 'EVENT_NOT_FOUND'
      | 'REGISTRATION_DISABLED'
      | 'SOLD_OUT'
      | 'TOO_MANY_PERSONS'
      | 'OCCURRENCE_NOT_FOUND',
  ) {
    super(code);
  }
}

function validatePayload(payload: any) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
  const personCount = Number(payload.personCount);
  const specialEventOccurrenceId =
    typeof payload.specialEventOccurrenceId === 'string'
      ? payload.specialEventOccurrenceId.trim()
      : '';

  if (!name) {
    throw new Error('INVALID_NAME');
  }

  if (!email || !email.includes('@')) {
    throw new Error('INVALID_EMAIL');
  }

  if (!Number.isInteger(personCount) || personCount < 1 || personCount > 100) {
    throw new Error('INVALID_PERSON_COUNT');
  }

  if (!specialEventOccurrenceId) {
    throw new Error('INVALID_OCCURRENCE');
  }

  return {
    name,
    email,
    phone: phone || undefined,
    personCount,
    specialEventOccurrenceId,
    newsletterConfirmation: Boolean(payload.newsletterConfirmation),
  };
}

async function createRegistrationWithRetry(params: {
  specialEventId: string;
  specialEventOccurrenceId: string;
  name: string;
  email: string;
  phone?: string;
  personCount: number;
}) {
  const normalizedEmail = params.email.toLowerCase();

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
              name: true,
              isPublished: true,
              bookingType: true,
              maxPersonsPerRegistration: true,
              priceCents: true,
              occurrences: {
                where: {
                  id: params.specialEventOccurrenceId,
                },
                select: {
                  id: true,
                  capacity: true,
                  startTime: true,
                  endTime: true,
                  eventDate: true,
                },
              },
            },
          });

          if (!event || !event.isPublished) {
            throw new RegistrationError('EVENT_NOT_FOUND');
          }

          const occurrence = event.occurrences[0];

          if (!occurrence) {
            throw new RegistrationError('OCCURRENCE_NOT_FOUND');
          }

          if (event.bookingType !== 'INTERNAL_REGISTRATION') {
            throw new RegistrationError('REGISTRATION_DISABLED');
          }

          if (params.personCount > event.maxPersonsPerRegistration) {
            throw new RegistrationError('TOO_MANY_PERSONS');
          }

          const existingRegistration = await tx.eventRegistration.findFirst({
            where: {
              specialEventOccurrenceId: occurrence.id,
              email: normalizedEmail,
            },
            select: {
              id: true,
              status: true,
              personCount: true,
            },
          });

          if (existingRegistration?.status === 'REGISTERED') {
            throw new Error('ALREADY_REGISTERED');
          }

          const isPaidEvent = Boolean(event.priceCents && event.priceCents > 0);

          if (occurrence.capacity !== null) {
            const now = new Date();

            const aggregate = await tx.eventRegistration.aggregate({
              where: {
                specialEventOccurrenceId: occurrence.id,

                ...(existingRegistration
                  ? {
                      NOT: {
                        id: existingRegistration.id,
                      },
                    }
                  : {}),

                OR: [
                  {
                    status: 'REGISTERED',
                  },
                  {
                    status: 'PENDING_PAYMENT',
                    paymentExpiresAt: {
                      gt: now,
                    },
                  },
                ],
              },
              _sum: {
                personCount: true,
              },
            });

            const currentPersonCount = aggregate._sum.personCount ?? 0;

            if (currentPersonCount + params.personCount > occurrence.capacity) {
              throw new RegistrationError('SOLD_OUT');
            }
          }

          const paymentExpiresAt = isPaidEvent
            ? new Date(Date.now() + 30 * 60 * 1000)
            : null;

          const registrationData = {
            specialEventId: event.id,
            specialEventOccurrenceId: occurrence.id,
            name: params.name,
            email: normalizedEmail,
            phone: params.phone || null,
            personCount: params.personCount,
            status: isPaidEvent ? 'PENDING_PAYMENT' : 'REGISTERED',
            priceCentsTotal: isPaidEvent
              ? event.priceCents! * params.personCount
              : null,
            paymentExpiresAt,
            stripeCheckoutSessionId: null,
          } satisfies Prisma.EventRegistrationUncheckedCreateInput;

          if (existingRegistration) {
            return tx.eventRegistration.update({
              where: {
                id: existingRegistration.id,
              },
              data: registrationData,
              select: {
                id: true,
                email: true,
                name: true,
                personCount: true,
                status: true,
                specialEvent: {
                  select: {
                    id: true,
                    name: true,
                    priceCents: true,
                  },
                },
                specialEventOccurrence: {
                  select: {
                    id: true,
                    startTime: true,
                    endTime: true,
                    eventDate: true,
                  },
                },
              },
            });
          }

          return tx.eventRegistration.create({
            data: registrationData,
            select: {
              id: true,
              email: true,
              name: true,
              personCount: true,
              status: true,
              specialEvent: {
                select: {
                  id: true,
                  name: true,
                  priceCents: true,
                },
              },
              specialEventOccurrence: {
                select: {
                  id: true,
                  startTime: true,
                  endTime: true,
                  eventDate: true,
                },
              },
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
  res: NextApiResponse<ApiPostSpecialEventRegisterResponse>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const specialEventId = String(req.query.specialEventId);

  try {
    const payload = validatePayload(req.body);

    const registration = await createRegistrationWithRetry({
      specialEventId,
      specialEventOccurrenceId: payload.specialEventOccurrenceId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      personCount: payload.personCount,
    });

    if (payload.newsletterConfirmation) {
      await createNewsletterSubscription(payload.email, payload.name);
    }

    const occurrence = registration.specialEventOccurrence;
    if (occurrence === null)
      return res.status(400).json({
        error: 'Bitte wähle einen Termin aus.',
      });

    const isPaidEvent =
      registration.specialEvent.priceCents !== null &&
      registration.specialEvent.priceCents > 0;

    if (isPaidEvent) {
      const session = await createSpecialEventStripeSession({
        registrationId: registration.id,
        specialEventId: registration.specialEvent.id,
        eventName: registration.specialEvent.name,
        eventDate: occurrence.eventDate.date,
        startTime: occurrence.startTime,
        email: registration.email,
        personCount: registration.personCount,
        priceCentsPerPerson: registration.specialEvent.priceCents!,
      });

      await prisma.eventRegistration.update({
        where: {
          id: registration.id,
        },
        data: {
          stripeCheckoutSessionId: session.id,
        },
      });

      if (!session.url) {
        return res.status(500).json({
          error: 'Die Stripe-Zahlung konnte nicht gestartet werden.',
        });
      }

      return res.status(200).json({
        requiresPayment: true,
        url: session.url,
      });
    }

    await sendSpecialEventConfirmationMail(
      registration.email,
      registration.specialEvent.name,
      registration.name,
      registration.personCount,
      occurrence.eventDate.date,
      occurrence.startTime,
    );

    return res.status(201).json({
      requiresPayment: false,
      id: registration.id,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      switch (error.message) {
        case 'INVALID_NAME':
          return res.status(400).json({ error: 'Bitte gib einen Namen ein.' });

        case 'INVALID_EMAIL':
          return res.status(400).json({
            error: 'Bitte gib eine gültige E-Mail-Adresse ein.',
          });

        case 'INVALID_PERSON_COUNT':
          return res.status(400).json({
            error: 'Bitte wähle eine gültige Personenzahl aus.',
          });

        case 'INVALID_OCCURRENCE':
          return res.status(400).json({
            error: 'Bitte wähle einen Termin aus.',
          });

        case 'ALREADY_REGISTERED':
          return res.status(409).json({
            error:
              'Mit dieser E-Mail-Adresse wurde bereits eine bestätigte Anmeldung vorgenommen.',
          });
      }
    }

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

        case 'OCCURRENCE_NOT_FOUND':
          return res.status(404).json({
            error: 'Der ausgewählte Termin ist nicht mehr verfügbar.',
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
