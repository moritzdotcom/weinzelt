import type { NextApiRequest, NextApiResponse } from 'next';
import archiver from 'archiver';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { generateInvoicePDF } from '@/lib/pdf/generateInvoicePdf';
import { Address } from '@/lib/reservation';

type InvoiceLineItem = {
  name: string;
  qty: number;
  unitCents: number;
  vatRate: 7 | 19 | 0;
  totalCents: number;
};

function parseDate(value: unknown) {
  if (typeof value !== 'string' || !value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function safeFilename(value: string) {
  return value
    .replace(/[^\wäöüÄÖÜß\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatDateForFilename(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatEventDateLabel(seating: any) {
  // Bitte an dein Seating/Event Model anpassen.
  // Mögliche Felder: seating.date, seating.eventDate, seating.event.date
  const rawDate =
    seating?.date ?? seating?.eventDate ?? seating?.event?.date ?? null;

  if (!rawDate) return 'Datum unbekannt';

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) return 'Datum unbekannt';

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatTimeslotLabel(seating: any) {
  // Bitte an dein Seating Model anpassen.
  // Mögliche Felder: seating.timeslot, seating.startTime, seating.endTime
  if (seating?.timeslot) return seating.timeslot;

  if (seating?.startTime && seating?.endTime) {
    return `${seating.startTime} - ${seating.endTime}`;
  }

  if (seating?.time) return seating.time;

  return 'Timeslot unbekannt';
}

function parseLineItems(value: unknown): InvoiceLineItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const li = item as Record<string, unknown>;

      const vatRate = Number(li.vatRate);

      if (vatRate !== 0 && vatRate !== 7 && vatRate !== 19) return null;

      return {
        name: String(li.name ?? 'Position'),
        qty: Number(li.qty ?? 1),
        unitCents: Number(li.unitCents ?? 0),
        vatRate,
        totalCents: Number(li.totalCents ?? 0),
      } satisfies InvoiceLineItem;
    })
    .filter(Boolean) as InvoiceLineItem[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req);
  if (!session) return res.status(401).json({ message: 'Unauthorized' });

  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);

  const where = {
    ...(from || to
      ? {
          issuedAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: endOfDay(to) } : {}),
          },
        }
      : {}),
  };

  const invoices = await prisma.reservationInvoice.findMany({
    where,
    orderBy: {
      issuedAt: 'asc',
    },
    select: {
      lineItems: true,
      invoiceNumber: true,
      issuedAt: true,
      customerName: true,
      customerEmail: true,
      billingAddress: true,
      vat7Cents: true,
      vat19Cents: true,
      totalCents: true,
      reservation: {
        select: {
          seating: {
            select: { timeslot: true, eventDate: { select: { date: true } } },
          },
        },
      },
    },
  });

  const fromLabel = from ? formatDateForFilename(from) : 'alle';
  const toLabel = to ? formatDateForFilename(to) : 'alle';
  const zipFilename = `rechnungen_${fromLabel}_bis_${toLabel}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

  const archive = archiver('zip', {
    zlib: { level: 9 },
  });

  archive.on('error', (err) => {
    console.error(err);

    if (!res.headersSent) {
      res.status(500).json({ message: 'ZIP export failed' });
    } else {
      res.end();
    }
  });

  archive.pipe(res);

  for (const invoice of invoices) {
    const lineItems = parseLineItems(invoice.lineItems);

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      billingAddress: invoice.billingAddress as Address,
      eventDateLabel: invoice.reservation.seating.eventDate.date,
      timeslot: invoice.reservation.seating.timeslot,
      lineItems,
      vat7Cents: invoice.vat7Cents,
      vat19Cents: invoice.vat19Cents,
      totalCents: invoice.totalCents,
    });

    const customer = safeFilename(invoice.customerName || 'kunde');
    const invoiceNo = safeFilename(invoice.invoiceNumber);
    const date = formatDateForFilename(invoice.issuedAt);

    archive.append(pdfBuffer, {
      name: `${date}_${invoiceNo}_${customer}.pdf`,
    });
  }

  await archive.finalize();
}

export const config = {
  api: {
    responseLimit: false,
  },
};
