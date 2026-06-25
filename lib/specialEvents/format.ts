import { PublicSpecialEvent } from '.';

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
