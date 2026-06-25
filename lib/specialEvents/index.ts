import {
  Prisma,
  SpecialEventBookingType,
  SpecialEventCategory,
} from '@prisma/client';
import { supabase } from '../supabase';

export type PublicSpecialEventOccurrence = {
  id: string;
  eventDate: {
    id: string;
    date: string;
    dow?: string | null;
  };
  startTime: string;
  endTime: string;
  capacity: number | null;
  remainingCapacity: number | null;
  isSoldOut: boolean;
};

export type PublicSpecialEvent = {
  id: string;
  name: string;
  description: string;
  category: SpecialEventCategory;
  badge: string | null;
  titleImageUrl: string | null;
  priceCents: number | null;
  priceLabel: string | null;
  ctaLabel: string;
  bookingType: SpecialEventBookingType;
  externalUrl: string | null;
  maxPersonsPerRegistration: number;
  isPublished?: boolean;

  attachmentUrl: string | null;
  attachmentLabel: string | null;

  occurrences: PublicSpecialEventOccurrence[];

  // Optional für alte Komponenten / Convenience
  eventDate: PublicSpecialEventOccurrence['eventDate'];
  startTime: string;
  endTime: string;
  remainingCapacity: number | null;
  isSoldOut: boolean;
};

export type AdminSpecialEvent = PublicSpecialEvent & {
  eventDateId: string | null;
  titleImagePath: string | null;
  isPublished: boolean;
  registeredPersonCount: number;
  _count: {
    registrations: number;
  };
};

export function getActiveRegistrationWhere() {
  const now = new Date();

  return {
    OR: [
      {
        status: 'REGISTERED' as const,
      },
      {
        status: 'PENDING_PAYMENT' as const,
        paymentExpiresAt: {
          gt: now,
        },
      },
    ],
  };
}

function getSupabaseImageUrl(titleImagePath: string | null) {
  if (!titleImagePath) return null;

  return supabase.storage.from('Weinzelt').getPublicUrl(titleImagePath).data
    .publicUrl;
}

export function mapSpecialEventToPublic(
  event: Prisma.SpecialEventGetPayload<{
    include: {
      occurrences: {
        include: {
          eventDate: { select: { id: true; date: true; dow: true } };
          registrations: { select: { personCount: true } };
        };
      };
    };
  }>,
): PublicSpecialEvent {
  const occurrences = event.occurrences.map((occurrence) => {
    const registeredPersonCount = occurrence.registrations.reduce(
      (sum: number, registration) => sum + registration.personCount,
      0,
    );

    const remainingCapacity =
      occurrence.capacity === null
        ? null
        : Math.max(0, occurrence.capacity - registeredPersonCount);

    return {
      id: occurrence.id,
      eventDate: {
        id: occurrence.eventDate.id,
        date: occurrence.eventDate.date,
        dow: occurrence.eventDate.dow,
      },
      startTime: occurrence.startTime,
      endTime: occurrence.endTime,
      capacity: occurrence.capacity,
      remainingCapacity,
      isSoldOut: remainingCapacity !== null && remainingCapacity <= 0,
    };
  });

  const firstOccurrence = occurrences[0];

  const totalRemainingCapacity = occurrences.some(
    (occurrence: PublicSpecialEventOccurrence) =>
      occurrence.remainingCapacity === null,
  )
    ? null
    : occurrences.reduce(
        (sum: number, occurrence: PublicSpecialEventOccurrence) =>
          sum + (occurrence.remainingCapacity ?? 0),
        0,
      );

  return {
    id: event.id,
    name: event.name,
    description: event.description,
    category: event.category,
    badge: event.badge,
    titleImageUrl: event.titleImagePath
      ? getSupabaseImageUrl(event.titleImagePath)
      : null,
    priceCents: event.priceCents,
    priceLabel: event.priceLabel,
    ctaLabel: event.ctaLabel,
    bookingType: event.bookingType,
    externalUrl: event.externalUrl,
    maxPersonsPerRegistration: event.maxPersonsPerRegistration,

    attachmentUrl: event.attachmentPath
      ? getSupabaseImageUrl(event.attachmentPath)
      : null,
    attachmentLabel: event.attachmentLabel,

    occurrences,

    eventDate: firstOccurrence?.eventDate ?? {
      id: '',
      date: '',
      dow: null,
    },
    startTime: firstOccurrence?.startTime ?? '',
    endTime: firstOccurrence?.endTime ?? '',
    remainingCapacity: totalRemainingCapacity,
    isSoldOut:
      occurrences.length > 0 &&
      occurrences.every(
        (occurrence: PublicSpecialEventOccurrence) => occurrence.isSoldOut,
      ),
  };
}

export function mapSpecialEventToAdmin(
  event: Prisma.SpecialEventGetPayload<{
    include: {
      occurrences: {
        include: {
          eventDate: { select: { id: true; date: true; dow: true } };
          registrations: {
            select: { personCount: true; status: true; paymentExpiresAt: true };
          };
        };
      };
      _count: {
        select: {
          registrations: {
            where: {
              status: 'REGISTERED';
            };
          };
        };
      };
    };
  }>,
): AdminSpecialEvent {
  const now = new Date();
  const registeredPersonCount = event.occurrences.reduce(
    (globalSum, occurrence) => {
      return (
        globalSum +
        occurrence.registrations.reduce((sum, registration) => {
          const isConfirmed = registration.status === 'REGISTERED';

          const isActivePendingPayment =
            registration.status === 'PENDING_PAYMENT' &&
            registration.paymentExpiresAt &&
            registration.paymentExpiresAt > now;

          if (!isConfirmed && !isActivePendingPayment) {
            return sum;
          }

          return sum + registration.personCount;
        }, 0)
      );
    },
    0,
  );

  return {
    ...mapSpecialEventToPublic(event),
    eventDateId: event.eventDateId,
    titleImagePath: event.titleImagePath,
    isPublished: event.isPublished,
    registeredPersonCount,
    _count: event._count,
  };
}
