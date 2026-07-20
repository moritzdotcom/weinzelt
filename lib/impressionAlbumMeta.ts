export type AlbumMeta = {
  title: string;
  dateLabel: string;
  sortValue: number;
};

const weekdays = [
  'montag',
  'dienstag',
  'mittwoch',
  'donnerstag',
  'freitag',
  'samstag',
  'sonntag',
];

export function parseAlbumMeta(year: number, day: string): AlbumMeta {
  const trimmedDay = day.trim();

  /*
   * Unterstützte Varianten:
   *
   * 17.07. Audiokitchen
   * 17.07 - Audiokitchen
   * 17.07. - Audiokitchen
   * 17.07.2026 Audiokitchen
   * 17.07.2026 - Audiokitchen
   * Freitag 17.07. Audiokitchen
   * Freitag, 17.07. - Audiokitchen
   * Audiokitchen
   */
  const albumMatch = trimmedDay.match(
    new RegExp(
      `^(?:(${weekdays.join('|')})\\s*,?\\s*)?` +
        `(\\d{1,2})\\.(\\d{1,2})` +
        `(?:\\.(\\d{2}|\\d{4}))?` +
        `\\.?\\s*` +
        `(?:[-–—|:]\\s*)?` +
        `(.*)$`,
      'i',
    ),
  );

  if (!albumMatch) {
    return {
      title: trimmedDay || `Weinzelt ${year}`,
      dateLabel: String(year),
      sortValue: Date.UTC(year, 0, 1, 12),
    };
  }

  const dayNumber = Number(albumMatch[2]);
  const monthNumber = Number(albumMatch[3]);
  const suppliedYear = albumMatch[4];

  let parsedYear = year;

  if (suppliedYear) {
    const numericYear = Number(suppliedYear);
    parsedYear = numericYear < 100 ? 2000 + numericYear : numericYear;
  }

  const date = new Date(Date.UTC(parsedYear, monthNumber - 1, dayNumber, 12));

  const isValidDate =
    date.getUTCFullYear() === parsedYear &&
    date.getUTCMonth() === monthNumber - 1 &&
    date.getUTCDate() === dayNumber;

  const parsedTitle = albumMatch[5].trim();
  const title = parsedTitle || `Weinzelt ${year}`;

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
