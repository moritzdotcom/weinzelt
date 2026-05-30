import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  const { specialEventId } = req.query;
  if (typeof specialEventId !== 'string')
    return res.status(401).json('Special Event required');

  if (req.method === 'GET') {
    await handleGET(req, res, specialEventId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

export type ApiGetSpecialEventResponse = Exclude<
  Awaited<ReturnType<typeof getSpecialEvent>>,
  null
>;

function getPublicImageUrl(titleImagePath: string | null) {
  if (!titleImagePath) return null;

  return supabase.storage.from('Weinzelt').getPublicUrl(titleImagePath).data
    .publicUrl;
}

async function getSpecialEvent(id: string) {
  const event = await prisma.specialEvent.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      eventDateId: true,
      eventDate: {
        select: {
          id: true,
          date: true,
          dow: true,
        },
      },
      startTime: true,
      endTime: true,
      category: true,
      badge: true,
      titleImagePath: true,
      priceCents: true,
      priceLabel: true,
      ctaLabel: true,
      bookingType: true,
      externalUrl: true,
      capacity: true,
      maxPersonsPerRegistration: true,
      sortOrder: true,
      isPublished: true,
      registrations: {
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          personCount: true,
          status: true,
          createdAt: true,
          canceledAt: true,
          reminderSent: true,
          reminderLastAttemptAt: true,
          reminderAttemptCount: true,
          reminderFailureReason: true,
        },
      },
    },
  });

  if (!event) return null;

  const activeRegistrations = event.registrations.filter(
    (registration) => registration.status === 'REGISTERED',
  );

  const registeredPersonCount = activeRegistrations.reduce(
    (sum, registration) => sum + registration.personCount,
    0,
  );

  const pendingReminderCount = activeRegistrations.filter(
    (registration) => !registration.reminderSent,
  ).length;

  const failedReminderCount = activeRegistrations.filter(
    (registration) =>
      !registration.reminderSent && registration.reminderAttemptCount > 0,
  ).length;

  const sentReminderCount = activeRegistrations.filter((registration) =>
    Boolean(registration.reminderSent),
  ).length;

  const remainingCapacity =
    event.capacity === null
      ? null
      : Math.max(0, event.capacity - registeredPersonCount);

  return {
    ...event,
    titleImageUrl: getPublicImageUrl(event.titleImagePath),
    stats: {
      registrationCount: activeRegistrations.length,
      registeredPersonCount,
      canceledRegistrationCount:
        event.registrations.length - activeRegistrations.length,
      remainingCapacity,
      pendingReminderCount,
      failedReminderCount,
      sentReminderCount,
    },
  };
}

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  specialEventId: string,
) {
  const event = await getSpecialEvent(specialEventId);

  if (!event) {
    return res.status(404).json({
      error: 'Das WineEvent wurde nicht gefunden.',
    });
  }

  return res.status(200).json(event);
}
