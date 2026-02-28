import prisma from '@/lib/prismadb';
import { generateInvoicePDF } from './pdf/generateInvoicePdf';
import sendReservationInvoiceMail from '@/lib/mailer/sendReservationInvoiceMail';

function makeInvoiceNumber(year: number, seq: number) {
  return `R-${year}-${String(seq).padStart(6, '0')}`;
}

function calcVatFromGross(grossCents: number, vatRate: 7 | 19) {
  // Brutto -> MwSt-Anteil (für Ausweis)
  // vat = gross - gross/(1+rate)
  const denom = 1 + vatRate / 100;
  return Math.round(grossCents - grossCents / denom);
}

export async function createReservationInvoice(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      seating: {
        include: {
          eventDate: true,
          externalTicketConfig: true,
        },
      },
    },
  });

  if (!reservation) throw new Error('Reservation not found');
  if (reservation.paymentStatus !== 'PAID')
    throw new Error('Reservation not paid');

  // idempotent: falls schon Rechnung existiert
  const existing = await prisma.reservationInvoice.findUnique({
    where: { reservationId },
    select: { id: true },
  });
  if (existing) return;

  const issuedAt = new Date();
  const year = issuedAt.getFullYear();

  // ---- Beträge (CENT) ----
  // Annahmen:
  // - minimumSpend ist EUR (integer) und ist der “Mindestverzehr” (19%)
  // - Ticket optional (7%) in EUR integer aus externalTicketConfig
  // - Versand 5,90 € (19%) -> du kannst hier deine Konstante übernehmen
  const shippingCents = 590;

  const minimumSpendCents = (reservation.minimumSpend ?? 0) * 100;

  const ticketCfg = reservation.seating.externalTicketConfig;
  const ticketCents = ticketCfg
    ? (ticketCfg.ticketPerPerson ? reservation.people : 1) *
      ticketCfg.ticketPrice *
      100
    : 0;

  // ⚠️ Wenn du ticketFee bereits in reservation.minimumSpend eingerechnet hast,
  // dann MUSST du ticketCents hier auf 0 setzen ODER minimumSpendCents entsprechend bereinigen.
  // Sonst wird Ticket doppelt fakturiert.

  const lineItems = [
    {
      name:
        reservation.type === 'VIP' ? 'Mindestverzehr VIP' : 'Mindestverzehr',
      qty: reservation.tableCount,
      unitCents: Math.round(
        minimumSpendCents / Math.max(1, reservation.tableCount),
      ),
      vatRate: 19 as const,
      totalCents: minimumSpendCents,
    },
    ...(ticketCents > 0
      ? [
          {
            name: `Ticketgebühr – ${ticketCfg!.name}`,
            qty: ticketCfg!.ticketPerPerson ? reservation.people : 1,
            unitCents: ticketCfg!.ticketPrice * 100,
            vatRate: 7 as const,
            totalCents: ticketCents,
          },
        ]
      : []),
    {
      name: 'Versand',
      qty: 1,
      unitCents: shippingCents,
      vatRate: 19 as const,
      totalCents: shippingCents,
    },
  ];

  const vat7Cents = ticketCents > 0 ? calcVatFromGross(ticketCents, 7) : 0;
  const vat19Cents =
    calcVatFromGross(minimumSpendCents, 19) +
    calcVatFromGross(shippingCents, 19);

  const totalCents = minimumSpendCents + ticketCents + shippingCents;

  const subtotalCents = totalCents - vat7Cents - vat19Cents;

  // ---- Invoice Number (transaction safe) ----
  const invoice = await prisma.$transaction(async (tx) => {
    const seq = await tx.invoiceSequence.upsert({
      where: { year },
      update: { seq: { increment: 1 } },
      create: { year, seq: 1 },
      select: { seq: true },
    });

    const invoiceNumber = makeInvoiceNumber(year, seq.seq);

    return tx.reservationInvoice.create({
      data: {
        reservationId,
        invoiceNumber,
        issuedAt,
        currency: 'EUR',
        subtotalCents,
        vat7Cents,
        vat19Cents,
        totalCents,
        lineItems,
        customerName: reservation.name,
        customerEmail: reservation.email,
        billingAddress: reservation.billingAddress ?? undefined,
      },
    });
  });
  return await generateInvoicePDF({
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    billingAddress: (invoice.billingAddress as any) ?? null,
    eventDateLabel: reservation.seating.eventDate.date,
    timeslot: reservation.seating.timeslot,
    lineItems: lineItems as any,
    vat7Cents,
    vat19Cents,
    totalCents,
  });
}

export async function createAndSendReservationInvoice(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      seating: {
        include: {
          eventDate: true,
          externalTicketConfig: true,
        },
      },
    },
  });

  if (!reservation) throw new Error('Reservation not found');
  if (reservation.paymentStatus !== 'PAID')
    throw new Error('Reservation not paid');

  // idempotent: falls schon Rechnung existiert
  const existing = await prisma.reservationInvoice.findUnique({
    where: { reservationId },
    select: { id: true },
  });
  if (existing) return;

  const issuedAt = new Date();
  const year = issuedAt.getFullYear();

  // ---- Beträge (CENT) ----
  // Annahmen:
  // - minimumSpend ist EUR (integer) und ist der “Mindestverzehr” (19%)
  // - Ticket optional (7%) in EUR integer aus externalTicketConfig
  // - Versand 5,90 € (19%) -> du kannst hier deine Konstante übernehmen
  const shippingCents = 590;

  const minimumSpendCents = (reservation.minimumSpend ?? 0) * 100;

  const ticketCfg = reservation.seating.externalTicketConfig;
  const ticketCents = ticketCfg
    ? (ticketCfg.ticketPerPerson ? reservation.people : 1) *
      ticketCfg.ticketPrice *
      100
    : 0;

  // ⚠️ Wenn du ticketFee bereits in reservation.minimumSpend eingerechnet hast,
  // dann MUSST du ticketCents hier auf 0 setzen ODER minimumSpendCents entsprechend bereinigen.
  // Sonst wird Ticket doppelt fakturiert.

  const lineItems = [
    {
      name:
        reservation.type === 'VIP' ? 'Mindestverzehr VIP' : 'Mindestverzehr',
      qty: reservation.tableCount,
      unitCents: Math.round(
        minimumSpendCents / Math.max(1, reservation.tableCount),
      ),
      vatRate: 19 as const,
      totalCents: minimumSpendCents,
    },
    ...(ticketCents > 0
      ? [
          {
            name: `Ticketgebühr – ${ticketCfg!.name}`,
            qty: ticketCfg!.ticketPerPerson ? reservation.people : 1,
            unitCents: ticketCfg!.ticketPrice * 100,
            vatRate: 7 as const,
            totalCents: ticketCents,
          },
        ]
      : []),
    {
      name: 'Versand',
      qty: 1,
      unitCents: shippingCents,
      vatRate: 19 as const,
      totalCents: shippingCents,
    },
  ];

  const vat7Cents = ticketCents > 0 ? calcVatFromGross(ticketCents, 7) : 0;
  const vat19Cents =
    calcVatFromGross(minimumSpendCents, 19) +
    calcVatFromGross(shippingCents, 19);

  const totalCents = minimumSpendCents + ticketCents + shippingCents;

  const subtotalCents = totalCents - vat7Cents - vat19Cents;

  // ---- Invoice Number (transaction safe) ----
  const invoice = await prisma.$transaction(async (tx) => {
    const seq = await tx.invoiceSequence.upsert({
      where: { year },
      update: { seq: { increment: 1 } },
      create: { year, seq: 1 },
      select: { seq: true },
    });

    const invoiceNumber = makeInvoiceNumber(year, seq.seq);

    return tx.reservationInvoice.create({
      data: {
        reservationId,
        invoiceNumber,
        issuedAt,
        currency: 'EUR',
        subtotalCents,
        vat7Cents,
        vat19Cents,
        totalCents,
        lineItems,
        customerName: reservation.name,
        customerEmail: reservation.email,
        billingAddress: reservation.billingAddress ?? undefined,
      },
    });
  });

  // ---- PDF ----
  const pdf = await generateInvoicePDF({
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    billingAddress: (invoice.billingAddress as any) ?? null,
    eventDateLabel: reservation.seating.eventDate.date,
    timeslot: reservation.seating.timeslot,
    lineItems: lineItems as any,
    vat7Cents,
    vat19Cents,
    totalCents,
  });

  // ---- Mail ----
  await sendReservationInvoiceMail({
    to: reservation.email,
    name: reservation.name,
    invoiceNumber: invoice.invoiceNumber,
    invoicePdf: pdf,
  });

  await prisma.reservationInvoice.update({
    where: { id: invoice.id },
    data: { sentAt: new Date() },
  });
}
