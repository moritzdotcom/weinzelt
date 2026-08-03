export type BillingAddressInput = {
  company: string;
  contactName?: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
};

export type ReceiptTaxLine = {
  rate: number;
  netCents: number;
  taxCents: number;
  grossCents: number;
};

export type ReceiptPaymentLine = {
  label: string;
  amountCents: number;
};

export type ParsedTebiReceipt = {
  receiptNumber: string;
  receiptDate: string;

  createdAtLabel: string;
  paidAtLabel: string | null;

  tableNumber: string | null;

  netCents: number;
  vatCents: number;

  /**
   * Summe der Beträge, die in den MwSt.-Zeilen enthalten sind.
   * Auf dem Beispielbeleg: 2.363,00 €
   */
  subtotalCents: number;

  /**
   * Separat ausgewiesenes Trinkgeld.
   * Auf dem Beispielbeleg: 187,00 €
   */
  tipCents: number;

  /**
   * Tatsächlich gezahlter Gesamtbetrag.
   * Auf dem Beispielbeleg: 2.550,00 €
   */
  grossCents: number;

  currency: 'EUR';

  taxLines: ReceiptTaxLine[];
  payments: ReceiptPaymentLine[];
};

export function emptyBillingAddress(): BillingAddressInput {
  return {
    company: '',
    contactName: '',
    line1: '',
    line2: '',
    postalCode: '',
    city: '',
    country: 'Deutschland',
  };
}

export function normalizeBillingAddress(
  value: unknown,
): BillingAddressInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;

  const stringValue = (...keys: string[]) => {
    for (const key of keys) {
      const value = raw[key];

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  };

  const street = stringValue('street');
  const houseNumber = stringValue('houseNumber');

  return {
    company: stringValue('company', 'organization', 'name'),
    contactName: stringValue('contactName', 'recipientName'),
    line1:
      stringValue('line1', 'addressLine1') ||
      [street, houseNumber].filter(Boolean).join(' '),
    line2: stringValue('line2', 'addressLine2'),
    postalCode: stringValue('postalCode', 'zip', 'zipCode'),
    city: stringValue('city'),
    country: stringValue('country') || 'Deutschland',
  };
}

export function isCompleteBillingAddress(
  address: BillingAddressInput | null | undefined,
): address is BillingAddressInput {
  if (!address) return false;

  return Boolean(
    address.company.trim() &&
    address.line1.trim() &&
    address.postalCode.trim() &&
    address.city.trim() &&
    address.country.trim(),
  );
}
