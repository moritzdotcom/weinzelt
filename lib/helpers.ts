export function centsToEUR(cents: number) {
  return formatEUR(cents / 100);
}

export function formatEUR(eur: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(eur);
}

export function formatDate(value: Date | string | null) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}
