export type ImpressionAlbumMeta = {
  title: string;
  dateLabel: string;
  sortValue: number;
};

const WEEKDAYS = [
  'montag',
  'dienstag',
  'mittwoch',
  'donnerstag',
  'freitag',
  'samstag',
  'sonntag',
];

export function parseImpressionAlbumMeta(
  year: number,
  day: string,
): ImpressionAlbumMeta {
  const trimmedDay = day.trim();

  /*
   * Unterstützte Beispiele:
   *
   * 16.07. First Impressions
   * 16.07 - First Impressions
   * Donnerstag 16.07. First Impressions
   * First Impressions
   */
  const dateMatch = trimmedDay.match(
    /(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/,
  );

  if (!dateMatch) {
    return {
      title: trimmedDay || `Weinzelt ${year}`,
      dateLabel: String(year),
      sortValue: Date.UTC(year, 0, 1, 12),
    };
  }

  const dayNumber = Number(dateMatch[1]);
  const monthNumber = Number(dateMatch[2]);

  let parsedYear = year;

  if (dateMatch[3]) {
    const suppliedYear = Number(dateMatch[3]);
    parsedYear = suppliedYear < 100 ? 2000 + suppliedYear : suppliedYear;
  }

  const date = new Date(
    Date.UTC(parsedYear, monthNumber - 1, dayNumber, 12),
  );

  const isValidDate =
    date.getUTCFullYear() === parsedYear &&
    date.getUTCMonth() === monthNumber - 1 &&
    date.getUTCDate() === dayNumber;

  let title = trimmedDay
    .replace(dateMatch[0], '')
    .replace(/^[\s\-–—|:]+/, '')
    .trim();

  const weekdayPattern = new RegExp(
    `^(${WEEKDAYS.join('|')})[\\s,\\-–—|:]*`,
    'i',
  );

  title = title.replace(weekdayPattern, '').trim();

  if (!title) {
    title = `Weinzelt ${year}`;
  }

  if (!isValidDate) {
    return {
      title,
      dateLabel: String(year),
      sortValue: Date.UTC(year, 0, 1, 12),
    };
  }

  return {
    title,
    dateLabel: new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Berlin',
    }).format(date),
    sortValue: date.getTime(),
  };
}

export function formatPhotoCount(photoCount: number) {
  if (photoCount === 0) {
    return 'Noch keine Fotos';
  }

  return `${photoCount} ${photoCount === 1 ? 'Foto' : 'Fotos'}`;
}
