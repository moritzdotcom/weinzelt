import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import type { PublicSpecialEvent } from '@/lib/specialEvents';
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
    select: {
      id: true,
      name: true,
      description: true,
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
      eventDate: {
        select: {
          id: true,
          date: true,
          dow: true,
        },
      },
      registrations: {
        where: {
          status: 'REGISTERED',
        },
        select: {
          personCount: true,
        },
      },
    },
  });

  if (!event) {
    return res.status(404).json({
      error: 'Das WineEvent wurde nicht gefunden.',
    });
  }

  const registeredPersonCount = event.registrations.reduce(
    (sum, registration) => sum + registration.personCount,
    0,
  );

  const remainingCapacity =
    event.capacity === null
      ? null
      : Math.max(0, event.capacity - registeredPersonCount);

  return res.status(200).json({
    id: event.id,
    name: event.name,
    description: event.description,
    startTime: event.startTime,
    endTime: event.endTime,
    category: event.category,
    badge: event.badge,
    titleImageUrl: getPublicImageUrl(event.titleImagePath),
    priceCents: event.priceCents,
    priceLabel: event.priceLabel,
    ctaLabel: event.ctaLabel,
    bookingType: event.bookingType,
    externalUrl: event.externalUrl,
    capacity: event.capacity,
    remainingCapacity,
    maxPersonsPerRegistration: event.maxPersonsPerRegistration,
    isSoldOut: remainingCapacity === 0,
    eventDate: {
      id: event.eventDate.id,
      date: event.eventDate.date,
      dow: event.eventDate.dow,
    },
  });
}
