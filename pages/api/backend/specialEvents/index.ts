import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { AdminSpecialEvent } from '@/lib/specialEvents';

function getPublicImageUrl(titleImagePath: string | null) {
  if (!titleImagePath) return null;

  return supabase.storage.from('Weinzelt').getPublicUrl(titleImagePath).data
    .publicUrl;
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    await handleGET(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse<AdminSpecialEvent[] | { error: string }>,
) {
  const eventId =
    typeof req.query.eventId === 'string' ? req.query.eventId : undefined;

  const events = await prisma.specialEvent.findMany({
    where: eventId
      ? {
          eventDate: {
            eventId,
          },
        }
      : undefined,
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
    include: {
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
          status: true,
          paymentExpiresAt: true,
          personCount: true,
        },
      },
      _count: {
        select: {
          registrations: {
            where: {
              status: 'REGISTERED',
            },
          },
        },
      },
    },
  });

  return res.status(200).json(
    events.map((event) => {
      const now = new Date();

      const registeredPersonCount = event.registrations.reduce(
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
          : Math.max(0, event.capacity - registeredPersonCount);

      return {
        id: event.id,
        name: event.name,
        description: event.description,
        eventDateId: event.eventDateId,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        category: event.category,
        badge: event.badge,
        titleImagePath: event.titleImagePath,
        titleImageUrl: getPublicImageUrl(event.titleImagePath),
        attachmentUrl: getPublicImageUrl(event.attachmentPath),
        attachmentLabel: event.attachmentLabel,
        priceCents: event.priceCents,
        priceLabel: event.priceLabel,
        ctaLabel: event.ctaLabel,
        bookingType: event.bookingType,
        externalUrl: event.externalUrl,
        capacity: event.capacity,
        remainingCapacity,
        maxPersonsPerRegistration: event.maxPersonsPerRegistration,
        sortOrder: event.sortOrder,
        isPublished: event.isPublished,
        registeredPersonCount,
        isSoldOut: remainingCapacity === 0,
        _count: event._count,
      };
    }),
  );
}
