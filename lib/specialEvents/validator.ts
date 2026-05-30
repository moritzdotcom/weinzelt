import { SpecialEventBookingType, SpecialEventCategory } from '@prisma/client';

export type SpecialEventPayload = {
  name: string;
  description: string;
  eventDateId: string;
  startTime: string;
  endTime: string;
  category: SpecialEventCategory;
  badge?: string;
  ctaLabel: string;
  bookingType: SpecialEventBookingType;
  externalUrl?: string;
  priceCents: number | null;
  priceLabel?: string;
  capacity: number | null;
  maxPersonsPerRegistration: number;
  sortOrder: number;
  isPublished: boolean;
  removeTitleImage: boolean;
};

export type UntrustedSpecialEventPayload = Omit<
  Partial<SpecialEventPayload>,
  'category' | 'bookingType'
> & {
  category?: unknown;
  bookingType?: unknown;
};

export type SpecialEventValidationError = {
  field: keyof SpecialEventPayload | 'general';
  message: string;
};

export type ValidateSpecialEventPayloadResult =
  | {
      valid: true;
      payload: SpecialEventPayload;
      errors: [];
    }
  | {
      valid: false;
      payload: null;
      errors: SpecialEventValidationError[];
    };

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Dein Schema verwendet aktuell UUIDs.
 * Falls du später CUIDs oder andere IDs nutzt, kannst du diesen Check entfernen
 * oder entsprechend anpassen.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
): value is T[keyof T] {
  return (
    typeof value === 'string' &&
    Object.values(enumObject).includes(value as T[keyof T])
  );
}

function isValidExternalUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function getTimeInMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim();

  return normalized || undefined;
}

function isIntegerOrNull(value: unknown): value is number | null {
  return (
    value === null || (typeof value === 'number' && Number.isInteger(value))
  );
}

export function validateSpecialEventPayload(
  input: UntrustedSpecialEventPayload,
): ValidateSpecialEventPayloadResult {
  const errors: SpecialEventValidationError[] = [];

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const description =
    typeof input.description === 'string' ? input.description.trim() : '';
  const eventDateId =
    typeof input.eventDateId === 'string' ? input.eventDateId.trim() : '';
  const startTime =
    typeof input.startTime === 'string' ? input.startTime.trim() : '';
  const endTime = typeof input.endTime === 'string' ? input.endTime.trim() : '';

  const badge = normalizeOptionalString(input.badge);
  const priceLabel = normalizeOptionalString(input.priceLabel);
  const externalUrl = normalizeOptionalString(input.externalUrl);

  const ctaLabel =
    typeof input.ctaLabel === 'string' ? input.ctaLabel.trim() : '';

  const priceCents = input.priceCents ?? null;
  const capacity = input.capacity ?? null;
  const sortOrder = input.sortOrder ?? 0;
  const maxPersonsPerRegistration = input.maxPersonsPerRegistration ?? 10;
  const isPublished = input.isPublished ?? false;
  const removeTitleImage = input.removeTitleImage ?? false;

  /*
   * Grundlegende Inhalte
   */
  if (name.length < 2) {
    errors.push({
      field: 'name',
      message: 'Der Name muss mindestens 2 Zeichen enthalten.',
    });
  }

  if (name.length > 120) {
    errors.push({
      field: 'name',
      message: 'Der Name darf maximal 120 Zeichen enthalten.',
    });
  }

  if (description.length < 10) {
    errors.push({
      field: 'description',
      message: 'Die Beschreibung muss mindestens 10 Zeichen enthalten.',
    });
  }

  if (description.length > 5_000) {
    errors.push({
      field: 'description',
      message: 'Die Beschreibung darf maximal 5.000 Zeichen enthalten.',
    });
  }

  if (!UUID_REGEX.test(eventDateId)) {
    errors.push({
      field: 'eventDateId',
      message: 'Es muss ein gültiger Veranstaltungstag ausgewählt werden.',
    });
  }

  /*
   * Uhrzeiten
   */
  if (!TIME_REGEX.test(startTime)) {
    errors.push({
      field: 'startTime',
      message: 'Die Startzeit muss im Format HH:mm angegeben werden.',
    });
  }

  if (!TIME_REGEX.test(endTime)) {
    errors.push({
      field: 'endTime',
      message: 'Die Endzeit muss im Format HH:mm angegeben werden.',
    });
  }

  if (
    TIME_REGEX.test(startTime) &&
    TIME_REGEX.test(endTime) &&
    getTimeInMinutes(endTime) <= getTimeInMinutes(startTime)
  ) {
    errors.push({
      field: 'endTime',
      message: 'Die Endzeit muss nach der Startzeit liegen.',
    });
  }

  /*
   * Enums zur Laufzeit prüfen.
   * Ein TypeScript-Cast allein würde ungültige Werte nicht verhindern.
   */
  if (!isValidEnumValue(SpecialEventCategory, input.category)) {
    errors.push({
      field: 'category',
      message: 'Die ausgewählte Kategorie ist ungültig.',
    });
  }

  if (!isValidEnumValue(SpecialEventBookingType, input.bookingType)) {
    errors.push({
      field: 'bookingType',
      message: 'Die ausgewählte Buchungsart ist ungültig.',
    });
  }

  /*
   * CTA
   */
  if (
    input.bookingType !== SpecialEventBookingType.NONE &&
    ctaLabel.length < 2
  ) {
    errors.push({
      field: 'ctaLabel',
      message: 'Für buchbare Events wird ein CTA benötigt.',
    });
  }

  if (ctaLabel.length > 50) {
    errors.push({
      field: 'ctaLabel',
      message: 'Der CTA darf maximal 50 Zeichen enthalten.',
    });
  }

  /*
   * Preis
   */
  if (!isIntegerOrNull(priceCents) || (priceCents !== null && priceCents < 0)) {
    errors.push({
      field: 'priceCents',
      message: 'Der Preis muss eine positive Ganzzahl in Cent sein.',
    });
  }

  const isPaidEvent = typeof priceCents === 'number' && priceCents > 0;

  /*
   * Buchungslogik
   */
  if (
    input.bookingType === SpecialEventBookingType.EXTERNAL_LINK &&
    !externalUrl
  ) {
    errors.push({
      field: 'externalUrl',
      message: 'Für externe Buchungen wird ein Reservierungslink benötigt.',
    });
  }

  if (externalUrl && !isValidExternalUrl(externalUrl)) {
    errors.push({
      field: 'externalUrl',
      message: 'Der externe Reservierungslink ist ungültig.',
    });
  }

  if (
    isPaidEvent &&
    input.bookingType !== SpecialEventBookingType.EXTERNAL_LINK
  ) {
    errors.push({
      field: 'bookingType',
      message:
        'Kostenpflichtige Events müssen über eine externe Reservierungsplattform gebucht werden.',
    });
  }

  /*
   * Kapazitäten
   */
  if (!isIntegerOrNull(capacity) || (capacity !== null && capacity < 1)) {
    errors.push({
      field: 'capacity',
      message: 'Die Kapazität muss mindestens 1 betragen.',
    });
  }

  if (
    !Number.isInteger(maxPersonsPerRegistration) ||
    maxPersonsPerRegistration < 1 ||
    maxPersonsPerRegistration > 50
  ) {
    errors.push({
      field: 'maxPersonsPerRegistration',
      message:
        'Die maximale Personenzahl pro Anmeldung muss zwischen 1 und 50 liegen.',
    });
  }

  if (
    input.bookingType === SpecialEventBookingType.INTERNAL_REGISTRATION &&
    capacity !== null &&
    maxPersonsPerRegistration > capacity
  ) {
    errors.push({
      field: 'maxPersonsPerRegistration',
      message:
        'Die maximale Personenzahl pro Anmeldung darf nicht größer als die Gesamtkapazität sein.',
    });
  }

  /*
   * Sonstige numerische und boolesche Felder
   */
  if (!Number.isInteger(sortOrder)) {
    errors.push({
      field: 'sortOrder',
      message: 'Die Sortierung muss eine Ganzzahl sein.',
    });
  }

  if (typeof isPublished !== 'boolean') {
    errors.push({
      field: 'isPublished',
      message: 'Der Veröffentlichungsstatus ist ungültig.',
    });
  }

  if (typeof removeTitleImage !== 'boolean') {
    errors.push({
      field: 'removeTitleImage',
      message: 'Der Bildstatus ist ungültig.',
    });
  }

  if (errors.length > 0) {
    return {
      valid: false,
      payload: null,
      errors,
    };
  }

  /*
   * Ab hier sind die Enum-Werte durch die Runtime-Checks abgesichert.
   */
  const category = input.category as SpecialEventCategory;
  const bookingType = input.bookingType as SpecialEventBookingType;

  return {
    valid: true,
    errors: [],
    payload: {
      name,
      description,
      eventDateId,
      startTime,
      endTime,
      category,
      badge,
      ctaLabel:
        bookingType === SpecialEventBookingType.NONE
          ? ctaLabel || 'Mehr erfahren'
          : ctaLabel,
      bookingType,

      /*
       * Externe Links werden nur gespeichert, wenn sie tatsächlich gebraucht
       * werden. So bleiben alte Links nach einer Umstellung nicht unbemerkt
       * in der Datenbank bestehen.
       */
      externalUrl:
        bookingType === SpecialEventBookingType.EXTERNAL_LINK
          ? externalUrl
          : undefined,

      priceCents,
      priceLabel,

      /*
       * Eine Kapazität ist nur für interne Registrierungen relevant.
       */
      capacity:
        bookingType === SpecialEventBookingType.INTERNAL_REGISTRATION
          ? capacity
          : null,

      maxPersonsPerRegistration,
      sortOrder,
      isPublished,
      removeTitleImage,
    },
  };
}
