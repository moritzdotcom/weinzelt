import sendSpecialEventReminderMail from '@/lib/mailer/specialEventReminderMail';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import type { NextApiRequest, NextApiResponse } from 'next';

const BATCH_SIZE = 10;
const MAX_CONCURRENT_MAILS = 3;
const MAX_AUTOMATIC_ATTEMPTS = 3;

export type ApiSendSpecialEventReminderResponse = {
  attempted: number;
  sent: number;
  failed: number;
  remaining: number;
  permanentlyFailed: number;
  done: boolean;
};

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function splitIntoChunks<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return 'Unbekannter Fehler beim Versand';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSendSpecialEventReminderResponse | { error: string }>,
) {
  const session = await getServerSession(req);

  if (!session) {
    return res.status(401).json({
      error: 'Nicht autorisiert.',
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const specialEventId = req.query.specialEventId;
  const occurrenceId = req.query.occurrenceId;

  if (typeof specialEventId !== 'string') {
    return res.status(400).json({
      error: 'Es wurde kein WineEvent angegeben.',
    });
  }

  if (typeof occurrenceId !== 'string') {
    return res.status(400).json({
      error: 'Es wurde kein Termin angegeben.',
    });
  }

  const event = await prisma.specialEvent.findUnique({
    where: {
      id: specialEventId,
    },
    select: {
      id: true,
      name: true,
      startTime: true,
      bookingType: true,
      eventDate: {
        select: {
          date: true,
        },
      },
    },
  });

  if (!event) {
    return res.status(404).json({
      error: 'Das WineEvent wurde nicht gefunden.',
    });
  }

  if (event.bookingType !== 'INTERNAL_REGISTRATION') {
    return res.status(400).json({
      error:
        'Reminder können nur für WineEvents mit interner Anmeldung verschickt werden.',
    });
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      specialEventId,
      specialEventOccurrenceId: occurrenceId,
      status: 'REGISTERED',
      reminderSent: null,
      reminderAttemptCount: {
        lt: MAX_AUTOMATIC_ATTEMPTS,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: BATCH_SIZE,
    select: {
      id: true,
      email: true,
      name: true,
      specialEventOccurrence: {
        select: {
          eventDate: {
            select: { date: true },
          },
          startTime: true,
        },
      },
    },
  });

  let sent = 0;
  let failed = 0;

  const chunks = splitIntoChunks(registrations, MAX_CONCURRENT_MAILS);

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(async (registration) => {
        await prisma.eventRegistration.update({
          where: {
            id: registration.id,
          },
          data: {
            reminderAttemptCount: {
              increment: 1,
            },
            reminderLastAttemptAt: new Date(),
          },
        });

        await sendSpecialEventReminderMail(
          registration.email,
          event.name,
          registration.name,
          registration.specialEventOccurrence?.eventDate.date || '',
          registration.specialEventOccurrence?.startTime || '',
        );

        await prisma.eventRegistration.update({
          where: {
            id: registration.id,
          },
          data: {
            reminderSent: new Date(),
            reminderFailureReason: null,
          },
        });

        return registration.id;
      }),
    );

    for (const [index, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        sent += 1;
        continue;
      }

      failed += 1;

      await prisma.eventRegistration.update({
        where: {
          id: chunk[index].id,
        },
        data: {
          reminderFailureReason: getErrorMessage(result.reason),
        },
      });
    }

    /*
     * Kleine Pause zwischen den parallelen Gruppen.
     * Dadurch werden externe Mail-Provider weniger aggressiv belastet.
     */
    if (chunks.length > 1) {
      await sleep(250);
    }
  }

  const [remaining, permanentlyFailed] = await Promise.all([
    prisma.eventRegistration.count({
      where: {
        specialEventId,
        status: 'REGISTERED',
        reminderSent: null,
        reminderAttemptCount: {
          lt: MAX_AUTOMATIC_ATTEMPTS,
        },
      },
    }),
    prisma.eventRegistration.count({
      where: {
        specialEventId,
        status: 'REGISTERED',
        reminderSent: null,
        reminderAttemptCount: {
          gte: MAX_AUTOMATIC_ATTEMPTS,
        },
      },
    }),
  ]);

  return res.status(200).json({
    attempted: registrations.length,
    sent,
    failed,
    remaining,
    permanentlyFailed,
    done: remaining === 0,
  });
}
