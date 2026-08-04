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
  subtotalCents: number;
  tipCents: number;
  grossCents: number;

  currency: 'EUR';
  taxLines: ReceiptTaxLine[];
  payments: ReceiptPaymentLine[];
};

export type ReceiptInvoiceMode =
  | 'SINGLE'
  | 'COLLECTION'
  | 'SPLIT';

export type ReceiptAssignmentType =
  | 'RESERVATION'
  | 'MANUAL';

export type ReceiptInvoiceRecipientInput = {
  email?: string;
  billingAddress: BillingAddressInput;
};

export type SingleReceiptInvoiceConfiguration = {
  mode: 'SINGLE';
  assignmentType: ReceiptAssignmentType;
  recipient: ReceiptInvoiceRecipientInput;
  saveBillingAddress: boolean;
};

export type CollectionReceiptInvoiceConfiguration = {
  mode: 'COLLECTION';
  assignmentType: 'RESERVATION';
  recipient: ReceiptInvoiceRecipientInput;
  saveBillingAddress: boolean;
};

export type SplitRecipientAllocationInput = {
  rate: number;
  grossCents: number;
};

export type SplitRecipientInput = {
  email?: string;
  billingAddress: BillingAddressInput;
  allocations: SplitRecipientAllocationInput[];
  tipCents: number;
};

export type SplitReceiptInvoiceConfiguration = {
  mode: 'SPLIT';
  assignmentType: ReceiptAssignmentType;
  recipients: SplitRecipientInput[];
};

export type CreateReceiptInvoiceConfiguration =
  | SingleReceiptInvoiceConfiguration
  | CollectionReceiptInvoiceConfiguration
  | SplitReceiptInvoiceConfiguration;

export type CreatedReceiptInvoiceDocument = {
  id: string;
  documentNumber: string;
  pdfUrl: string;
};

export type CreateReceiptInvoiceCaseResponse = {
  caseId: string;
  documents: CreatedReceiptInvoiceDocument[];
};

export type ReceiptInvoiceReservationSearchItem = {
  id: string;
  name: string;
  email: string;
  people: number;
  type: string;
  paymentStatus: string;
  tableNumber: string | null;
  createdAt: string;
  billingAddress: BillingAddressInput | null;
};

export type ReceiptInvoiceReservationSearchResponse = {
  reservations: ReceiptInvoiceReservationSearchItem[];
};

export type ParseReceiptResponse = {
  receipt: ParsedTebiReceipt;
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
      const item = raw[key];

      if (typeof item === 'string' && item.trim()) {
        return item.trim();
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

export function parseReceiptInvoiceMode(
  value: unknown,
): ReceiptInvoiceMode {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === 'collection') return 'COLLECTION';
  if (raw === 'split') return 'SPLIT';
  if (raw === 'COLLECTION' || raw === 'SPLIT') return raw;

  return 'SINGLE';
}

export function modeToQuery(
  mode: ReceiptInvoiceMode,
): string {
  switch (mode) {
    case 'COLLECTION':
      return 'collection';
    case 'SPLIT':
      return 'split';
    default:
      return 'single';
  }
}
