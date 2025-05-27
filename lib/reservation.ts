import { ConfirmationState, ReservationType } from '@prisma/client';

export function translateState(state: ConfirmationState) {
  if (state == 'REQUESTED') return 'Offen';
  if (state == 'DECLINED') return 'Abgelehnt';
  if (state == 'ACCEPTED') return 'Bestätigt';
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

export function fullPrice({
  packagePrice,
  totalFoodPrice,
}: {
  packagePrice: number;
  totalFoodPrice: number | null;
}) {
  return packagePrice + (totalFoodPrice ?? 0);
}
