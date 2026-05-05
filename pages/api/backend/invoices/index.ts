import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { Prisma, ReservationPaymentStatus } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export type ApiBackendInvoicesGetResponse = {
  invoices: BackendInvoiceListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type BackendInvoiceListItem = {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  sentAt: string | null;

  customerName: string;
  customerEmail: string;

  totalCents: number;
  currency: string;

  reservation: {
    id: string;
    name: string;
    email: string;
    people: number;
    type: string;
    paymentStatus: ReservationPaymentStatus;
    paidAt: string | null;
    manualPaymentTrackedBy: string | null;
    minimumSpend: number;
    tableNumber: string | null;
    seatingId: string;
    seating: unknown;
  };
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiBackendInvoicesGetResponse | { message: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req);
  if (!session) return res.status(401).json({ message: 'Unauthorized' });

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const status =
    typeof req.query.status === 'string' ? req.query.status : 'all';

  const page = Math.max(Number(req.query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 25), 1), 100);

  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);

  const where: Prisma.ReservationInvoiceFindManyArgs['where'] = {
    ...(from || to
      ? {
          issuedAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: endOfDay(to) } : {}),
          },
        }
      : {}),

    ...(q
      ? {
          OR: [
            {
              invoiceNumber: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              customerName: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              customerEmail: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              reservation: {
                name: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
            },
            {
              reservation: {
                email: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
            },
            {
              reservation: {
                tableNumber: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
            },
          ],
        }
      : {}),

    ...(status === 'sent'
      ? {
          sentAt: {
            not: null,
          },
        }
      : {}),

    ...(status === 'unsent'
      ? {
          sentAt: null,
        }
      : {}),

    ...(status === 'paid'
      ? {
          reservation: {
            paymentStatus: 'PAID',
          },
        }
      : {}),

    ...(status === 'unpaid'
      ? {
          reservation: {
            paymentStatus: {
              not: 'PAID',
            },
          },
        }
      : {}),
  };

  const [total, invoices] = await Promise.all([
    prisma.reservationInvoice.count({ where }),
    prisma.reservationInvoice.findMany({
      where,
      orderBy: {
        issuedAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reservation: {
          include: {
            seating: true,
          },
        },
      },
    }),
  ]);

  return res.status(200).json({
    total,
    page,
    pageSize,
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt.toISOString(),
      sentAt: invoice.sentAt?.toISOString() ?? null,

      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,

      totalCents: invoice.totalCents,
      currency: invoice.currency,

      reservation: {
        id: invoice.reservation.id,
        name: invoice.reservation.name,
        email: invoice.reservation.email,
        people: invoice.reservation.people,
        type: invoice.reservation.type,
        paymentStatus: invoice.reservation.paymentStatus,
        paidAt: invoice.reservation.paidAt?.toISOString() ?? null,
        manualPaymentTrackedBy:
          invoice.reservation.manualPaymentTrackedBy ?? null,
        minimumSpend: invoice.reservation.minimumSpend,
        tableNumber: invoice.reservation.tableNumber,
        seatingId: invoice.reservation.seatingId,
        seating: invoice.reservation.seating,
      },
    })),
  });
}
