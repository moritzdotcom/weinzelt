export function compareEventDates(
  date1: string | Date,
  date2: string | Date,
): number {
  const d1 =
    typeof date1 === 'string' ? parseEventDate(date1) : new Date(date1);
  const d2 =
    typeof date2 === 'string' ? parseEventDate(date2) : new Date(date2);
  return d1.getTime() - d2.getTime();
}

export function parseEventDate(dateString: string): Date {
  const [day, month, shortYear] = dateString.split('.').map(Number);

  if (
    !day ||
    !month ||
    shortYear === undefined ||
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(shortYear)
  ) {
    throw new Error(`Ungültiges Datumsformat: ${dateString}`);
  }

  const year = 2000 + shortYear;

  return new Date(year, month - 1, day);
}

export function isEventDateTodayOrPast(
  dateString: string,
  now = new Date(),
): boolean {
  const eventDate = parseEventDate(dateString);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return eventDate.getTime() <= today.getTime();
}
