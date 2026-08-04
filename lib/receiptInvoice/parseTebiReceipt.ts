import type {
  ParsedTebiReceipt,
  ReceiptPaymentLine,
  ReceiptTaxLine,
} from './types';

function parseEuroToCents(
  value: string,
): number {
  const normalized = value
    .replace(/\s/g, '')
    .replace(/€/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `Ungültiger Geldbetrag: ${value}`,
    );
  }

  return Math.round(parsed * 100);
}

function fullYear(year: string): number {
  const parsed = Number(year);

  if (year.length === 4) return parsed;

  return parsed >= 70
    ? 1900 + parsed
    : 2000 + parsed;
}

async function extractPdfText(
  buffer: Buffer,
): Promise<string> {
  // Die dynamische Reihenfolge verhindert den DOMMatrix-Fehler
  // in Vercel-Node-Funktionen.
  const { CanvasFactory } =
    await import('pdf-parse/worker');
  const { PDFParse } =
    await import('pdf-parse');

  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    CanvasFactory,
  });

  try {
    const result = await parser.getText();

    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function parseTebiReceiptPdf(
  buffer: Buffer,
): Promise<ParsedTebiReceipt> {
  const rawText = await extractPdfText(buffer);

  const text = rawText
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (!text) {
    throw new Error(
      'Das PDF enthält keinen auslesbaren Text. Möglicherweise handelt es sich um einen Scan.',
    );
  }

  const receiptNumberMatch = text.match(
    /Rechnungs-ID:\s*([A-Z0-9/_-]+)/i,
  );

  if (!receiptNumberMatch) {
    throw new Error(
      'Die Rechnungs-ID konnte nicht gefunden werden.',
    );
  }

  const createdMatch = text.match(
    /Erstellt:\s*(\d{2})\.(\d{2})\.(\d{2,4}),?\s*(\d{2}:\d{2}:\d{2})/i,
  );

  if (!createdMatch) {
    throw new Error(
      'Das Erstellungsdatum konnte nicht gefunden werden.',
    );
  }

  const [
    ,
    day,
    month,
    shortYear,
    createdTime,
  ] = createdMatch;

  const year = fullYear(shortYear);

  const receiptDate = [
    String(year).padStart(4, '0'),
    month.padStart(2, '0'),
    day.padStart(2, '0'),
  ].join('-');

  const createdAtLabel =
    `${day}.${month}.${year}, ${createdTime}`;

  const paidMatch = text.match(
    /Bezahlt:\s*(\d{2})\.(\d{2})\.(\d{2,4}),?\s*(\d{2}:\d{2}:\d{2})/i,
  );

  const paidAtLabel = paidMatch
    ? `${paidMatch[1]}.${paidMatch[2]}.${fullYear(
        paidMatch[3],
      )}, ${paidMatch[4]}`
    : null;

  const tableMatch = text.match(
    /Platz genommen an:\s*(.+?)(?:\n|\s+Erstellt:)/i,
  );

  const tableNumber =
    tableMatch?.[1]?.trim() || null;

  const grossMatch = text.match(
    /\bGesamt\s+€?\s*([\d.]+,\d{2})/i,
  );

  if (!grossMatch) {
    throw new Error(
      'Der Gesamtbetrag konnte nicht gefunden werden.',
    );
  }

  const grossCents =
    parseEuroToCents(grossMatch[1]);

  const taxLines: ReceiptTaxLine[] = [];

  const taxRegex =
    /MwSt\s+(\d+(?:[.,]\d+)?)%\s+€?\s*([\d.]+,\d{2})\s+€?\s*([\d.]+,\d{2})\s+€?\s*([\d.]+,\d{2})/gi;

  for (const match of text.matchAll(
    taxRegex,
  )) {
    taxLines.push({
      rate: Number(
        match[1].replace(',', '.'),
      ),
      netCents:
        parseEuroToCents(match[2]),
      taxCents:
        parseEuroToCents(match[3]),
      grossCents:
        parseEuroToCents(match[4]),
    });
  }

  if (taxLines.length === 0) {
    throw new Error(
      'Die Umsatzsteuer-Aufschlüsselung konnte nicht gefunden werden.',
    );
  }

  const netCents = taxLines.reduce(
    (sum, line) => sum + line.netCents,
    0,
  );

  const vatCents = taxLines.reduce(
    (sum, line) => sum + line.taxCents,
    0,
  );

  const taxGrossCents = taxLines.reduce(
    (sum, line) => sum + line.grossCents,
    0,
  );

  const subtotalMatch = text.match(
    /Zwischensumme\s+€?\s*([\d.]+,\d{2})/i,
  );

  const tipMatch = text.match(
    /Trinkgeld\s+€?\s*([\d.]+,\d{2})/i,
  );

  const tipCents = tipMatch
    ? parseEuroToCents(tipMatch[1])
    : 0;

  const subtotalCents = subtotalMatch
    ? parseEuroToCents(subtotalMatch[1])
    : grossCents - tipCents;

  if (
    Math.abs(
      taxGrossCents - subtotalCents,
    ) > 1
  ) {
    throw new Error(
      'Zwischensumme und Umsatzsteuer-Aufschlüsselung stimmen nicht überein.',
    );
  }

  if (
    Math.abs(
      netCents +
        vatCents -
        subtotalCents,
    ) > 1
  ) {
    throw new Error(
      'Netto-, Umsatzsteuer- und Zwischensumme stimmen nicht überein.',
    );
  }

  if (
    Math.abs(
      subtotalCents +
        tipCents -
        grossCents,
    ) > 1
  ) {
    throw new Error(
      'Zwischensumme, Trinkgeld und Gesamtbetrag stimmen nicht überein.',
    );
  }

  const paymentDefinitions: Array<{
    label: string;
    pattern: RegExp;
  }> = [
    {
      label: 'Reservierungsanzahlung',
      pattern:
        /Reservierungsanzahlung\s+€?\s*([\d.]+,\d{2})/i,
    },
    {
      label: 'Kartenzahlung',
      pattern:
        /Kartenzahlung(?:en)?\s+€?\s*([\d.]+,\d{2})/i,
    },
    {
      label: 'Barzahlung',
      pattern:
        /Barzahlung(?:en)?\s+€?\s*([\d.]+,\d{2})/i,
    },
    {
      label: 'Gutschein',
      pattern:
        /Gutschein(?:e)?\s+€?\s*([\d.]+,\d{2})/i,
    },
  ];

  const payments: ReceiptPaymentLine[] =
    [];

  for (const definition of paymentDefinitions) {
    const match = text.match(
      definition.pattern,
    );

    if (!match) continue;

    payments.push({
      label: definition.label,
      amountCents:
        parseEuroToCents(match[1]),
    });
  }

  const paidCents = payments.reduce(
    (sum, payment) =>
      sum + payment.amountCents,
    0,
  );

  if (
    payments.length > 0 &&
    Math.abs(paidCents - grossCents) > 1
  ) {
    throw new Error(
      'Die erkannten Zahlungsarten entsprechen nicht dem Gesamtbetrag.',
    );
  }

  return {
    receiptNumber:
      receiptNumberMatch[1],
    receiptDate,
    createdAtLabel,
    paidAtLabel,
    tableNumber,
    netCents,
    vatCents,
    subtotalCents,
    tipCents,
    grossCents,
    currency: 'EUR',
    taxLines,
    payments,
  };
}
