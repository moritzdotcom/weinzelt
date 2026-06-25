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
    include: {
      occurrences: {
        orderBy: [
          {
            sortOrder: 'asc',
          },
        ],
        include: {
          eventDate: true,
          registrations: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      },
    },
  });

  if (!event) return null;

  const occurrences = event.occurrences.map((occ) => {
    const activeRegistrations = occ.registrations.filter(
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

    const remainingCapacity =
      occ.capacity === null
        ? null
        : Math.max(0, occ.capacity - registeredPersonCount);

    return {
      ...occ,
      stats: {
        registrationCount: activeRegistrations.length,
        registeredPersonCount,
        remainingCapacity,
        pendingReminderCount,
        failedReminderCount,
      },
    };
  });

  return {
    ...event,
    occurrences,
    titleImageUrl: getPublicImageUrl(event.titleImagePath),
    stats: {
      registrationCount: occurrences.reduce(
        (sum, occ) => sum + occ.stats.registrationCount,
        0,
      ),
      registeredPersonCount: occurrences.reduce(
        (sum, occ) => sum + occ.stats.registeredPersonCount,
        0,
      ),
      remainingCapacity: occurrences.some(
        (occ) => occ.stats.remainingCapacity === null,
      )
        ? null
        : occurrences.reduce(
            (sum, occ) => sum + (occ.stats.remainingCapacity ?? 0),
            0,
          ),
      pendingReminderCount: occurrences.reduce(
        (sum, occ) => sum + occ.stats.pendingReminderCount,
        0,
      ),
      failedReminderCount: occurrences.reduce(
        (sum, occ) => sum + occ.stats.failedReminderCount,
        0,
      ),
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
