import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import {
  getActiveRegistrationWhere,
  mapSpecialEventToPublic,
  type PublicSpecialEvent,
} from '@/lib/specialEvents';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/session';

function getPublicImageUrl(titleImagePath: string | null) {
  if (!titleImagePath) return null;

  return supabase.storage.from('Weinzelt').getPublicUrl(titleImagePath).data
    .publicUrl;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicSpecialEvent | { error: string }>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const specialEventId = req.query.specialEventId;
  const session = await getServerSession(req);

  if (typeof specialEventId !== 'string') {
    return res.status(400).json({
      error: 'Es wurde kein WineEvent angegeben.',
    });
  }

  const event = await prisma.specialEvent.findFirst({
    where: {
      id: specialEventId,
      isPublished: session ? undefined : true,
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

  if (!event || event.occurrences.length === 0) {
    return res.status(404).json({
      error: 'Dieses WineEvent wurde nicht gefunden.',
    });
  }

  return res.status(200).json(mapSpecialEventToPublic(event));
}
