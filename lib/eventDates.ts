export function dateStrToDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
}

export function compareEventDates(
  date1: string | Date,
  date2: string | Date
): number {
  const d1 = typeof date1 === 'string' ? dateStrToDate(date1) : new Date(date1);
  const d2 = typeof date2 === 'string' ? dateStrToDate(date2) : new Date(date2);
  return d1.getTime() - d2.getTime();
}
