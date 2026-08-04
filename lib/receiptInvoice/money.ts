import type {
  ParsedTebiReceipt,
  ReceiptTaxLine,
} from './types';

export type ReceiptTotals = {
  netCents: number;
  vatCents: number;
  subtotalCents: number;
  tipCents: number;
  grossCents: number;
  currency: 'EUR';
  taxLines: ReceiptTaxLine[];
};

export function formatCents(
  cents: number,
  currency = 'EUR',
): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function aggregateReceipts(
  receipts: ParsedTebiReceipt[],
): ReceiptTotals {
  const taxMap = new Map<number, ReceiptTaxLine>();

  for (const receipt of receipts) {
    for (const taxLine of receipt.taxLines) {
      const current = taxMap.get(taxLine.rate) ?? {
        rate: taxLine.rate,
        netCents: 0,
        taxCents: 0,
        grossCents: 0,
      };

      current.netCents += taxLine.netCents;
      current.taxCents += taxLine.taxCents;
      current.grossCents += taxLine.grossCents;

      taxMap.set(taxLine.rate, current);
    }
  }

  return {
    netCents: receipts.reduce(
      (sum, receipt) => sum + receipt.netCents,
      0,
    ),
    vatCents: receipts.reduce(
      (sum, receipt) => sum + receipt.vatCents,
      0,
    ),
    subtotalCents: receipts.reduce(
      (sum, receipt) => sum + receipt.subtotalCents,
      0,
    ),
    tipCents: receipts.reduce(
      (sum, receipt) => sum + receipt.tipCents,
      0,
    ),
    grossCents: receipts.reduce(
      (sum, receipt) => sum + receipt.grossCents,
      0,
    ),
    currency: 'EUR',
    taxLines: Array.from(taxMap.values()).sort(
      (a, b) => a.rate - b.rate,
    ),
  };
}

export function allocateIntegerProportionally(
  total: number,
  weights: number[],
): number[] {
  if (!Number.isInteger(total) || total < 0) {
    throw new Error('Der zu verteilende Betrag ist ungültig.');
  }

  if (
    weights.some(
      (weight) => !Number.isInteger(weight) || weight < 0,
    )
  ) {
    throw new Error('Eine Gewichtung ist ungültig.');
  }

  const weightSum = weights.reduce(
    (sum, weight) => sum + weight,
    0,
  );

  if (weightSum === 0) {
    if (total === 0) return weights.map(() => 0);

    throw new Error(
      'Ein positiver Betrag kann nicht ohne Gewichtung verteilt werden.',
    );
  }

  const exact = weights.map(
    (weight) => (total * weight) / weightSum,
  );

  const result = exact.map(Math.floor);

  let remainder =
    total -
    result.reduce((sum, value) => sum + value, 0);

  const order = exact
    .map((value, index) => ({
      index,
      fraction: value - Math.floor(value),
    }))
    .sort(
      (a, b) =>
        b.fraction - a.fraction ||
        a.index - b.index,
    );

  for (let index = 0; index < remainder; index += 1) {
    result[order[index].index] += 1;
  }

  return result;
}
