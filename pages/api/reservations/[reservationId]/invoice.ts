import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { generateInvoicePDF } from '@/lib/pdf/generateInvoicePdf';
import { createReservationInvoice } from '@/lib/reservationInvoice';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { reservationId } = req.query;
  if (typeof reservationId !== 'string')
    return res.status(400).json({ error: 'Reservation required' });

  const session = await getServerSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return handleGET(req, res, reservationId);
}

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
) {
  // ✅ unique lookup
  const invoice = await prisma.reservationInvoice.findUnique({
    where: { reservationId: id },
    include: {
      reservation: {
        select: {
          seating: {
            select: { timeslot: true, eventDate: { select: { date: true } } },
          },
        },
      },
    },
  });

  try {
    let pdf: Buffer;
    let filename = 'Rechnung.pdf';

    if (invoice) {
      pdf = await generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        issuedAt: invoice.issuedAt,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        billingAddress: (invoice.billingAddress as any) ?? null,
        eventDateLabel: invoice.reservation.seating.eventDate.date,
        timeslot: invoice.reservation.seating.timeslot,
        lineItems: invoice.lineItems as any,
        vat7Cents: invoice.vat7Cents,
        vat19Cents: invoice.vat19Cents,
        totalCents: invoice.totalCents,
      });

      filename = `Rechnung_${invoice.invoiceNumber}.pdf`;
    } else {
      const invoicePdf = await createReservationInvoice(id);
      if (!invoicePdf)
        return res
          .status(400)
          .json({ error: 'Rechnung konnte nicht erstellt werden' });
      pdf = invoicePdf;
      filename = `Rechnung_${id}.pdf`; // fallback
    }

    res.setHeader('Content-Type', 'application/pdf');
    // inline = Browser preview; filename trotzdem korrekt
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
    return res.status(200).send(pdf);
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ error: 'Rechnung konnte nicht erstellt werden' });
  }
}
