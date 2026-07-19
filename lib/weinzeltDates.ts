export const WEINZELT_YEAR = 2026;
export const WEINZELT_OPENING = '2026-07-17T14:00:00+02:00';
export const WEINZELT_END = '2026-07-27T05:00:00+02:00';

const EVENT_DAY_CUTOFF_HOUR = 6;

export function parseEventDayDate(
  value: string,
  fallbackYear = WEINZELT_YEAR,
): Date | null {
  const match = value.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/);

  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const parsedYear = match[3] ? Number(match[3]) : fallbackYear;
  const year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Veranstaltungen nach Mitternacht gehören bis 06:00 Uhr weiterhin zum
 * vorherigen Weinzelt-Tag.
 */
export function getOperationalDate(date: Date) {
  return new Date(date.getTime() - EVENT_DAY_CUTOFF_HOUR * 60 * 60 * 1000);
}

export function isSameCalendarDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function getRelevantEventDayIndex<T extends { date: string }>(
  days: T[],
  now = new Date(),
) {
  if (days.length === 0) return -1;

  const operationalDate = getOperationalDate(now);
  const normalizedNow = new Date(
    operationalDate.getFullYear(),
    operationalDate.getMonth(),
    operationalDate.getDate(),
    12,
  ).getTime();

  const sameDayIndex = days.findIndex((day) => {
    const parsed = parseEventDayDate(day.date);
    return parsed ? parsed.getTime() === normalizedNow : false;
  });

  if (sameDayIndex >= 0) return sameDayIndex;

  const nextDayIndex = days.findIndex((day) => {
    const parsed = parseEventDayDate(day.date);
    return parsed ? parsed.getTime() > normalizedNow : false;
  });

  if (nextDayIndex >= 0) return nextDayIndex;

  return Math.max(0, days.length - 1);
}
