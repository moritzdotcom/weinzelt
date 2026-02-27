import { Address } from '@/lib/reservation';

export function formatAddressLines(a: Address): string[] {
  const lines: string[] = [];
  if (a.company?.trim()) lines.push(a.company.trim());
  if (a.line1?.trim()) lines.push(a.line1.trim());
  if (a.line2?.trim()) lines.push(a.line2.trim());
  lines.push(`${a.postalCode.trim()} ${a.city.trim()}`.trim());
  // Optional: Country nur anzeigen, wenn nicht DE (oder wenn du’s immer willst)
  if (a.country?.trim() && a.country.trim().toUpperCase() !== 'DE') {
    lines.push(a.country.trim().toUpperCase());
  }
  return lines;
}

export function addressToText(a: Address): string {
  return formatAddressLines(a).join('\n');
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function addressToHtml(a: Address): string {
  return formatAddressLines(a)
    .map((l) => escapeHtml(l))
    .join('<br/>');
}
