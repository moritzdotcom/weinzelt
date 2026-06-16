import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import type { PublicSpecialEvent } from '@/lib/specialEvents';
import { supabase } from '@/lib/supabase';

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
      orderBy: [
        {
          eventDate: {
            date: 'asc',
          },
        },
        {
          sortOrder: 'asc',
        },
        {
          startTime: 'asc',
        },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        eventDate: {
          select: {
            id: true,
            date: true,
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
        registrations: {
          where: {
            status: 'REGISTERED',
          },
          select: {
            status: true,
            paymentExpiresAt: true,
            personCount: true,
          },
        },
      },
    });

    const result: PublicSpecialEvent[] = events.map((event) => {
      const now = new Date();

      const registeredPersons = event.registrations.reduce(
        (sum, registration) => {
          const isConfirmed = registration.status === 'REGISTERED';

          const isActivePendingPayment =
            registration.status === 'PENDING_PAYMENT' &&
            registration.paymentExpiresAt &&
            registration.paymentExpiresAt > now;

          if (!isConfirmed && !isActivePendingPayment) {
            return sum;
          }

          return sum + registration.personCount;
        },
        0,
      );

      const remainingCapacity =
        event.capacity === null
          ? null
          : Math.max(0, event.capacity - registeredPersons);

      const titleImageUrl = event.titleImagePath
        ? supabase.storage.from('Weinzelt').getPublicUrl(event.titleImagePath)
            .data.publicUrl
        : null;

      return {
        id: event.id,
        name: event.name,
        description: event.description,
        eventDate: {
          id: event.eventDate.id,
          date: event.eventDate.date,
        },
        startTime: event.startTime,
        endTime: event.endTime,
        category: event.category,
        badge: event.badge,
        titleImageUrl,
        priceCents: event.priceCents,
        priceLabel: event.priceLabel,
        ctaLabel: event.ctaLabel,
        bookingType: event.bookingType,
        externalUrl: event.externalUrl,
        capacity: event.capacity,
        remainingCapacity,
        maxPersonsPerRegistration: event.maxPersonsPerRegistration,
        isSoldOut: remainingCapacity === 0,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Die WineEvents konnten nicht geladen werden.',
    });
  }
}
