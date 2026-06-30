import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import {
  getActiveRegistrationWhere,
  mapSpecialEventToPublic,
  type PublicSpecialEvent,
} from '@/lib/specialEvents';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicSpecialEvent[] | { error: string }>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const events = await prisma.specialEvent.findMany({
      where: {
        isPublished: true,
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
              where: getActiveRegistrationWhere(),
              select: {
                id: true,
                personCount: true,
                status: true,
                paymentExpiresAt: true,
              },
            },
          },
        },
      },
    });

    const result: PublicSpecialEvent[] = events
      .map(mapSpecialEventToPublic)
      .sort((a, b) =>
        a.occurrences[0].eventDate.date.localeCompare(
          b.occurrences[0].eventDate.date,
        ),
      );

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Die WineEvents konnten nicht geladen werden.',
    });
  }
}
