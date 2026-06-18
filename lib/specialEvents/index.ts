export type PublicSpecialEvent = {
  id: string;
  name: string;
  description: string;
  eventDate: {
    id: string;
    date: string;
    dow?: string;
  };
  startTime: string;
  endTime: string;
  category: 'WINE_WALK' | 'WINE_TASTING' | 'OTHER';
  badge: string | null;
  titleImageUrl: string | null;
  priceCents: number | null;
  priceLabel: string | null;
  ctaLabel: string;
  bookingType: 'INTERNAL_REGISTRATION' | 'EXTERNAL_LINK' | 'NONE';
  externalUrl: string | null;
  capacity: number | null;
  remainingCapacity: number | null;
  maxPersonsPerRegistration: number;
  isSoldOut: boolean;
  attachmentUrl: string | null;
  attachmentLabel: string | null;
};

export type AdminSpecialEvent = PublicSpecialEvent & {
  eventDateId: string;
  titleImagePath: string | null;
  sortOrder: number;
  isPublished: boolean;
  registeredPersonCount: number;
  _count: {
    registrations: number;
  };
};

export function formatSpecialEventPrice(event: {
  priceCents: number | null;
  priceLabel: string | null;
}) {
  if (event.priceLabel) return event.priceLabel;

  if (event.priceCents === null) return null;

  if (event.priceCents === 0) return 'Kostenlos';

  return `${(event.priceCents / 100).toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
  })} p. P.`;
}

export function formatSpecialEventCategory(
  category: PublicSpecialEvent['category'],
) {
  switch (category) {
    case 'WINE_WALK':
      return 'WineWalk';
    case 'WINE_TASTING':
      return 'WineTasting';
    default:
      return 'WineEvent';
  }
}
