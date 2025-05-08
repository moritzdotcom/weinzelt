import { ConfirmationState } from '@prisma/client';

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
