// lib/reservationsExportConfig.ts

export type ReservationExportFieldKey =
  | 'id'
  | 'name'
  | 'email'
  | 'people'
  | 'type'
  | 'paymentStatus'
  | 'eventName'
  | 'eventDate'
  | 'eventDow'
  | 'timeslot'
  | 'minimumSpend'
  | 'externalTicketPrice'
  | 'tableCount'
  | 'tableNumber'
  | 'internalNotes'
  | 'createdAt'
  | 'paidAt'
  | 'manualPaymentTrackedBy'
  | 'canceledAt'
  | 'referralCode'
  | 'invoiceNumber'
  | 'invoiceTotal'
  | 'invoiceIssuedAt'
  | 'billingCompany'
  | 'billingLine1'
  | 'billingLine2'
  | 'billingPostalCode'
  | 'billingCity'
  | 'billingCountry'
  | 'shippingCompany'
  | 'shippingLine1'
  | 'shippingLine2'
  | 'shippingPostalCode'
  | 'shippingCity'
  | 'shippingCountry'
  | 'stripeCheckoutSessionId'
  | 'stripePaymentIntentId';

export type ReservationExportSortKey =
  | 'eventDateAsc'
  | 'eventDateDesc'
  | 'timeslotAsc'
  | 'timeslotDesc'
  | 'nameAsc'
  | 'nameDesc'
  | 'createdAtAsc'
  | 'createdAtDesc'
  | 'peopleAsc'
  | 'peopleDesc'
  | 'minimumSpendAsc'
  | 'minimumSpendDesc'
  | 'tableNumberAsc'
  | 'tableNumberDesc';

export const RESERVATION_EXPORT_FIELD_GROUPS: {
  title: string;
  description?: string;
  fields: {
    key: ReservationExportFieldKey;
    label: string;
    default?: boolean;
  }[];
}[] = [
  {
    title: 'Gast',
    fields: [
      { key: 'name', label: 'Name', default: true },
      { key: 'email', label: 'E-Mail', default: true },
      { key: 'people', label: 'Personen', default: true },
      { key: 'type', label: 'Reservierungsart', default: true },
      { key: 'paymentStatus', label: 'Zahlungsstatus', default: true },
    ],
  },
  {
    title: 'Veranstaltung & Seating',
    fields: [
      { key: 'eventName', label: 'Veranstaltung' },
      { key: 'eventDate', label: 'Datum', default: true },
      { key: 'eventDow', label: 'Wochentag', default: true },
      { key: 'timeslot', label: 'Timeslot', default: true },
      { key: 'tableCount', label: 'Anzahl Tische', default: true },
      { key: 'tableNumber', label: 'Tischnummer' },
    ],
  },
  {
    title: 'Beträge',
    fields: [
      { key: 'minimumSpend', label: 'Mindestverzehr', default: true },
      { key: 'externalTicketPrice', label: 'Externe Tickets' },
      { key: 'invoiceTotal', label: 'Rechnungsbetrag' },
    ],
  },
  {
    title: 'Rechnung & Zahlung',
    fields: [
      { key: 'paidAt', label: 'Bezahlt am', default: true },
      { key: 'manualPaymentTrackedBy', label: 'Zahlung bestätigt von' },
      { key: 'invoiceNumber', label: 'Rechnungsnummer' },
      { key: 'invoiceIssuedAt', label: 'Rechnung erstellt am' },
      { key: 'stripeCheckoutSessionId', label: 'Stripe Checkout Session' },
      { key: 'stripePaymentIntentId', label: 'Stripe Payment Intent' },
    ],
  },
  {
    title: 'Rechnungsadresse',
    fields: [
      { key: 'billingCompany', label: 'Rechnung Firma' },
      { key: 'billingLine1', label: 'Rechnung Straße' },
      { key: 'billingLine2', label: 'Rechnung Zusatz' },
      { key: 'billingPostalCode', label: 'Rechnung PLZ' },
      { key: 'billingCity', label: 'Rechnung Stadt' },
      { key: 'billingCountry', label: 'Rechnung Land' },
    ],
  },
  {
    title: 'Versandadresse',
    fields: [
      { key: 'shippingCompany', label: 'Versand Firma' },
      { key: 'shippingLine1', label: 'Versand Straße' },
      { key: 'shippingLine2', label: 'Versand Zusatz' },
      { key: 'shippingPostalCode', label: 'Versand PLZ' },
      { key: 'shippingCity', label: 'Versand Stadt' },
      { key: 'shippingCountry', label: 'Versand Land' },
    ],
  },
  {
    title: 'Marketing & Sonstiges',
    fields: [
      { key: 'createdAt', label: 'Erstellt am', default: true },
      { key: 'referralCode', label: 'Referral Code' },
      { key: 'internalNotes', label: 'Interne Notizen' },
      { key: 'canceledAt', label: 'Storniert am' },
      { key: 'id', label: 'Reservierungs-ID' },
    ],
  },
];

export const RESERVATION_EXPORT_SORT_OPTIONS: {
  key: ReservationExportSortKey;
  label: string;
}[] = [
  { key: 'eventDateAsc', label: 'Datum aufsteigend' },
  { key: 'eventDateDesc', label: 'Datum absteigend' },
  { key: 'timeslotAsc', label: 'Timeslot aufsteigend' },
  { key: 'timeslotDesc', label: 'Timeslot absteigend' },
  { key: 'nameAsc', label: 'Name A-Z' },
  { key: 'nameDesc', label: 'Name Z-A' },
  { key: 'createdAtDesc', label: 'Neueste zuerst' },
  { key: 'createdAtAsc', label: 'Älteste zuerst' },
  { key: 'peopleDesc', label: 'Personen absteigend' },
  { key: 'peopleAsc', label: 'Personen aufsteigend' },
  { key: 'minimumSpendDesc', label: 'Mindestverzehr absteigend' },
  { key: 'minimumSpendAsc', label: 'Mindestverzehr aufsteigend' },
  { key: 'tableNumberAsc', label: 'Tischnummer aufsteigend' },
  { key: 'tableNumberDesc', label: 'Tischnummer absteigend' },
];

export function getDefaultReservationExportFields() {
  return RESERVATION_EXPORT_FIELD_GROUPS.flatMap((group) =>
    group.fields.filter((field) => field.default).map((field) => field.key),
  );
}

export function getAllReservationExportFieldKeys() {
  return RESERVATION_EXPORT_FIELD_GROUPS.flatMap((group) =>
    group.fields.map((field) => field.key),
  );
}

export function getReservationExportFieldLabel(key: ReservationExportFieldKey) {
  return (
    RESERVATION_EXPORT_FIELD_GROUPS.flatMap((group) => group.fields).find(
      (field) => field.key === key,
    )?.label ?? key
  );
}
