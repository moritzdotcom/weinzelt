import {
  allocateIntegerProportionally,
  type ReceiptTotals,
} from './money';
import {
  isCompleteBillingAddress,
  type ParsedTebiReceipt,
  type ReceiptInvoiceRecipientInput,
  type ReceiptTaxLine,
  type SplitRecipientInput,
} from './types';

export type ResolvedSplitDocument = {
  recipient: ReceiptInvoiceRecipientInput;
  totals: ReceiptTotals;
  allocations: {
    sourceReceiptNumber: string;
    taxLines: ReceiptTaxLine[];
    tipCents: number;
  }[];
};

function amountForRate(
  recipient: SplitRecipientInput,
  rate: number,
): number {
  return (
    recipient.allocations.find(
      (allocation) => allocation.rate === rate,
    )?.grossCents ?? 0
  );
}

export function validateSplitInput(
  receipt: ParsedTebiReceipt,
  recipients: SplitRecipientInput[],
): string[] {
  const errors: string[] = [];

  if (recipients.length < 2) {
    errors.push(
      'Für eine Aufteilung werden mindestens zwei Rechnungsempfänger benötigt.',
    );
  }

  recipients.forEach((recipient, index) => {
    if (!isCompleteBillingAddress(recipient.billingAddress)) {
      errors.push(
        `Die Rechnungsadresse von Empfänger ${index + 1} ist unvollständig.`,
      );
    }

    if (
      !Number.isInteger(recipient.tipCents) ||
      recipient.tipCents < 0
    ) {
      errors.push(
        `Das Trinkgeld von Empfänger ${index + 1} ist ungültig.`,
      );
    }

    for (const allocation of recipient.allocations) {
      if (
        !Number.isFinite(allocation.rate) ||
        !Number.isInteger(allocation.grossCents) ||
        allocation.grossCents < 0
      ) {
        errors.push(
          `Eine Steueraufteilung von Empfänger ${index + 1} ist ungültig.`,
        );
      }
    }

    const recipientTotal =
      recipient.allocations.reduce(
        (sum, allocation) =>
          sum + allocation.grossCents,
        0,
      ) + recipient.tipCents;

    if (recipientTotal <= 0) {
      errors.push(
        `Empfänger ${index + 1} hat keinen zugewiesenen Betrag.`,
      );
    }
  });

  for (const taxLine of receipt.taxLines) {
    const allocated = recipients.reduce(
      (sum, recipient) =>
        sum + amountForRate(recipient, taxLine.rate),
      0,
    );

    if (allocated !== taxLine.grossCents) {
      errors.push(
        `${taxLine.rate.toLocaleString(
          'de-DE',
        )} % MwSt.: ${allocated} Cent verteilt, ${taxLine.grossCents} Cent erforderlich.`,
      );
    }
  }

  const allocatedTip = recipients.reduce(
    (sum, recipient) => sum + recipient.tipCents,
    0,
  );

  if (allocatedTip !== receipt.tipCents) {
    errors.push(
      `Trinkgeld: ${allocatedTip} Cent verteilt, ${receipt.tipCents} Cent erforderlich.`,
    );
  }

  return errors;
}

export function resolveSplitDocuments(
  receipt: ParsedTebiReceipt,
  recipients: SplitRecipientInput[],
): ResolvedSplitDocument[] {
  const errors = validateSplitInput(receipt, recipients);

  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  const taxLinesPerRecipient: ReceiptTaxLine[][] =
    recipients.map(() => []);

  for (const sourceTaxLine of receipt.taxLines) {
    const grossWeights = recipients.map((recipient) =>
      amountForRate(recipient, sourceTaxLine.rate),
    );

    const netParts = allocateIntegerProportionally(
      sourceTaxLine.netCents,
      grossWeights,
    );

    recipients.forEach((recipient, index) => {
      const grossCents = grossWeights[index];
      const netCents = netParts[index];
      const taxCents = grossCents - netCents;

      taxLinesPerRecipient[index].push({
        rate: sourceTaxLine.rate,
        netCents,
        taxCents,
        grossCents,
      });
    });
  }

  const resolved = recipients.map(
    (recipient, recipientIndex): ResolvedSplitDocument => {
      const taxLines = taxLinesPerRecipient[
        recipientIndex
      ].filter((line) => line.grossCents > 0);

      const netCents = taxLines.reduce(
        (sum, line) => sum + line.netCents,
        0,
      );

      const vatCents = taxLines.reduce(
        (sum, line) => sum + line.taxCents,
        0,
      );

      const subtotalCents = taxLines.reduce(
        (sum, line) => sum + line.grossCents,
        0,
      );

      return {
        recipient: {
          email: recipient.email,
          billingAddress: recipient.billingAddress,
        },
        totals: {
          netCents,
          vatCents,
          subtotalCents,
          tipCents: recipient.tipCents,
          grossCents:
            subtotalCents + recipient.tipCents,
          currency: 'EUR',
          taxLines,
        },
        allocations: [
          {
            sourceReceiptNumber:
              receipt.receiptNumber,
            taxLines,
            tipCents: recipient.tipCents,
          },
        ],
      };
    },
  );

  const totalNet = resolved.reduce(
    (sum, document) =>
      sum + document.totals.netCents,
    0,
  );

  const totalVat = resolved.reduce(
    (sum, document) =>
      sum + document.totals.vatCents,
    0,
  );

  const totalGross = resolved.reduce(
    (sum, document) =>
      sum + document.totals.grossCents,
    0,
  );

  if (
    totalNet !== receipt.netCents ||
    totalVat !== receipt.vatCents ||
    totalGross !== receipt.grossCents
  ) {
    throw new Error(
      'Die centgenaue Aufteilung konnte nicht konsistent berechnet werden.',
    );
  }

  return resolved;
}
