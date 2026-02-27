import {
  ConfirmationState,
  ReservationPaymentStatus,
  ReservationType,
} from '@prisma/client';

export function translateState(state: ReservationPaymentStatus) {
  if (state == 'PENDING_PAYMENT') return 'Ausstehend';
  if (state == 'PAID') return 'Bezahlt';
  if (state == 'DRAFT') return 'Offen';
  if (state == 'CANCELED') return 'Storniert';
}

export function translateStateAdj(state: ConfirmationState) {
  if (state == 'REQUESTED') return 'offenen';
  if (state == 'DECLINED') return 'abgelehnten';
  if (state == 'ACCEPTED') return 'bestätigten';
}

export function translateType(type: ReservationType) {
  if (type == 'STANDING') return 'Stehtisch';
  if (type == 'VIP') return 'VIP Tisch';
}

export function determineTableCount(people: number) {
  return Math.ceil(people / 10);
}

export function determineMinimumSpend(
  type: ReservationType,
  people: number,
  seating: { minimumSpendVip: number; minimumSpendStanding: number },
) {
  const tableCount = determineTableCount(people);
  const minimumSpend =
    type === 'VIP'
      ? tableCount * seating.minimumSpendVip
      : tableCount * seating.minimumSpendStanding;
  return minimumSpend;
}

// lib/mailer/address.ts
export type Address = {
  company?: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string; // "DE"
};

// -> macht aus Prisma Json? wieder ein Address-Objekt (best effort)
export function asAddress(value: unknown): Address | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<Address>;
  if (!v.line1 || !v.postalCode || !v.city || !v.country) return null;

  return {
    company: v.company ?? '',
    line1: String(v.line1),
    line2: v.line2 ? String(v.line2) : '',
    postalCode: String(v.postalCode),
    city: String(v.city),
    country: String(v.country),
  };
}

export function getShippingAddressFromReservation(reservation: {
  shippingSameAsBilling: boolean;
  billingAddress: unknown | null;
  shippingAddress: unknown | null;
}): Address | null {
  const billing = asAddress(reservation.billingAddress);
  const shipping = asAddress(reservation.shippingAddress);

  if (reservation.shippingSameAsBilling) return billing;
  return shipping ?? billing; // fallback, falls shipping fehlt
}
