import {
  Prisma,
  SpecialEventBookingType,
  SpecialEventCategory,
} from '@prisma/client';

export type SpecialEventPayload = {
  eventId: string;
  name: string;
  description: string;
  category: SpecialEventCategory;
  badge?: string;
  ctaLabel: string;
  bookingType: SpecialEventBookingType;
  externalUrl?: string;
  priceCents: number | null;
  priceLabel?: string;
  maxPersonsPerRegistration: number;
  isPublished: boolean;
  removeTitleImage: boolean;
  removeAttachment: boolean;
  attachmentLabel: string | null;
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

export function parseOccurrences(value: string) {
  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      throw new Error('INVALID_OCCURRENCES');
    }

    return parsed.map((item, index) => {
      const id = typeof item.id === 'string' ? item.id.trim() : '';

      const eventDateId =
        typeof item.eventDateId === 'string' ? item.eventDateId.trim() : '';

      const startTime =
        typeof item.startTime === 'string' ? item.startTime.trim() : '';

      const endTime =
        typeof item.endTime === 'string' ? item.endTime.trim() : '';

      const capacity =
        item.capacity === '' ||
        item.capacity === null ||
        item.capacity === undefined
          ? null
          : Number(item.capacity);

      if (!eventDateId || !startTime || !endTime) {
        throw new Error('INVALID_OCCURRENCES');
      }

      if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
        throw new Error('INVALID_OCCURRENCES');
      }

      return {
        id,
        eventDateId,
        startTime,
        endTime,
        capacity,
        sortOrder: Number.isInteger(Number(item.sortOrder))
          ? Number(item.sortOrder)
          : index,
      };
    });
  } catch {
    throw new Error('INVALID_OCCURRENCES');
  }
}

type SyncOccurrenceInput = {
  id?: string;
  eventDateId: string;
  startTime: string;
  endTime: string;
  capacity: number | null;
  sortOrder: number;
};

export async function syncOccurrences(params: {
  tx: Prisma.TransactionClient;
  specialEventId: string;
  occurrences: SyncOccurrenceInput[];
  bookingType: SpecialEventBookingType;
}) {
  const existingOccurrences = await params.tx.specialEventOccurrence.findMany({
    where: {
      specialEventId: params.specialEventId,
    },
    select: {
      id: true,
      eventDateId: true,
      capacity: true,
      registrations: {
        where: {
          OR: [
            {
              status: 'REGISTERED',
            },
            {
              status: 'PENDING_PAYMENT',
              paymentExpiresAt: {
                gt: new Date(),
              },
            },
          ],
        },
        select: {
          personCount: true,
        },
      },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  });

  const existingById = new Map(
    existingOccurrences.map((occurrence) => [occurrence.id, occurrence]),
  );

  const nextIds = new Set(
    params.occurrences
      .map((occurrence) => occurrence.id)
      .filter((id): id is string => Boolean(id)),
  );

  /*
   * Entfernte Occurrences:
   * - ohne Registrierungen: wirklich löschen
   * - mit Registrierungen: behalten, damit normale Event-Bearbeitung nicht blockiert
   */
  for (const existingOccurrence of existingOccurrences) {
    if (nextIds.has(existingOccurrence.id)) continue;

    if (existingOccurrence._count.registrations > 0) {
      continue;
    }

    await params.tx.specialEventOccurrence.delete({
      where: {
        id: existingOccurrence.id,
      },
    });
  }

  for (const [index, occurrence] of params.occurrences.entries()) {
    const capacity =
      params.bookingType === 'INTERNAL_REGISTRATION'
        ? occurrence.capacity
        : null;

    const data = {
      eventDateId: occurrence.eventDateId,
      startTime: occurrence.startTime,
      endTime: occurrence.endTime,
      capacity,
      sortOrder: occurrence.sortOrder ?? index,
    };

    if (occurrence.id) {
      const existingOccurrence = existingById.get(occurrence.id);

      if (!existingOccurrence) {
        throw new Error('OCCURRENCE_NOT_FOUND');
      }

      const activePersonCount = existingOccurrence.registrations.reduce(
        (sum, registration) => sum + registration.personCount,
        0,
      );

      const hasRegistrations = existingOccurrence._count.registrations > 0;

      /*
       * Wenn schon Anmeldungen existieren, sollte das Datum nicht still geändert werden.
       * Uhrzeit darf man ändern, weil das fachlich manchmal nötig ist.
       */
      if (
        hasRegistrations &&
        existingOccurrence.eventDateId !== occurrence.eventDateId
      ) {
        throw new Error('OCCURRENCE_DATE_CHANGE_WITH_REGISTRATIONS');
      }

      /*
       * Kapazität darf nicht unter belegte Plätze fallen.
       */
      if (capacity !== null && activePersonCount > capacity) {
        throw new Error('OCCURRENCE_CAPACITY_TOO_LOW');
      }

      await params.tx.specialEventOccurrence.update({
        where: {
          id: occurrence.id,
        },
        data,
      });

      continue;
    }

    await params.tx.specialEventOccurrence.create({
      data: {
        ...data,
        specialEventId: params.specialEventId,
      },
    });
  }
}

export function validateSpecialEventPayload(
  input: UntrustedSpecialEventPayload,
): ValidateSpecialEventPayloadResult {
  const errors: SpecialEventValidationError[] = [];

  const eventId = typeof input.eventId === 'string' ? input.eventId.trim() : '';
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const description =
    typeof input.description === 'string' ? input.description.trim() : '';

  const badge = normalizeOptionalString(input.badge);
  const priceLabel = normalizeOptionalString(input.priceLabel);
  const externalUrl = normalizeOptionalString(input.externalUrl);

  const ctaLabel =
    typeof input.ctaLabel === 'string' ? input.ctaLabel.trim() : '';

  const priceCents = input.priceCents ?? null;
  const maxPersonsPerRegistration = input.maxPersonsPerRegistration ?? 10;
  const isPublished = input.isPublished ?? false;
  const removeTitleImage = input.removeTitleImage ?? false;
  const removeAttachment = input.removeAttachment ?? false;

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

  if (typeof removeAttachment !== 'boolean') {
    errors.push({
      field: 'removeAttachment',
      message: 'Der Anhangstatus ist ungültig.',
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
      eventId,
      name,
      description,
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

      maxPersonsPerRegistration,
      isPublished,
      removeTitleImage,

      removeAttachment,
      attachmentLabel: input.attachmentLabel?.trim() || null,
    },
  };
}
