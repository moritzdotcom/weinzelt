import sendSpecialEventReminderMail from '@/lib/mailer/specialEventReminderMail';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  const { specialEventId } = req.query;
  if (typeof specialEventId !== 'string')
    return res.status(401).json('Special Event required');

  if (req.method === 'POST') {
    await handlePOST(req, res, specialEventId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

async function handlePOST(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const event = await prisma.specialEvent.findUnique({
    where: { id },
    include: { registrations: true, eventDate: true },
  });

  if (!event) return res.json('No Event Found');

  await Promise.all(
    event?.registrations
      .filter((r) => !r.reminderSent)
      .map((r) =>
        sendSpecialEventReminderMail(
          r.email,
          event.name,
          r.name,
          event.eventDate.date,
          event.startTime
        )
      )
  );

  await prisma.eventRegistration.updateMany({
    where: { specialEventId: id, reminderSent: null },
    data: { reminderSent: new Date() },
  });

  return res.json(event);
}
