import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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

  const result = await prisma.eventRegistration.updateMany({
    where: {
      specialEventId,
      specialEventOccurrenceId: occurrenceId,
      status: 'REGISTERED',
      reminderSent: null,
      reminderAttemptCount: {
        gt: 0,
      },
    },
    data: {
      reminderAttemptCount: 0,
      reminderFailureReason: null,
      reminderLastAttemptAt: null,
    },
  });

  return res.status(200).json({
    reset: result.count,
  });
}
