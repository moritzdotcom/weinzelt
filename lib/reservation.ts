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
