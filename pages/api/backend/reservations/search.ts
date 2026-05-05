import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import {
  Prisma,
  ReservationPaymentStatus,
  ReservationType,
} from '@prisma/client';
import { getServerSession } from '@/lib/session';

export type ApiInvoiceReservationSearchResponse = {
  reservations: InvoiceReservationSearchItem[];
};

export type InvoiceReservationSearchItem = {
  id: string;
  name: string;
  email: string;
  people: number;
  type: ReservationType;
  paymentStatus: ReservationPaymentStatus;
  paidAt: string | null;
  minimumSpend: number;
  tableNumber: string | null;
  createdAt: string;

  seatingId: string;
  seating: unknown;

  invoice: {
    id: string;
    invoiceNumber: string;
    issuedAt: string;
    sentAt: string | null;
    totalCents: number;
  } | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    ApiInvoiceReservationSearchResponse | { message: string }
  >,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req);
  if (!session) return res.status(401).json({ message: 'Not authenticated' });

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const invoiceStatus =
    typeof req.query.invoiceStatus === 'string'
      ? req.query.invoiceStatus
      : 'all';

  const paymentStatus =
    typeof req.query.paymentStatus === 'string'
      ? req.query.paymentStatus
      : 'all';

  const where: Prisma.ReservationFindManyArgs['where'] = {
    ...(q
      ? {
          OR: [
            {
              name: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              tableNumber: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              id: q,
            },
          ],
        }
      : {}),

    ...(invoiceStatus === 'with'
      ? {
          invoice: {
            isNot: null,
          },
        }
      : {}),

    ...(invoiceStatus === 'without'
      ? {
          invoice: null,
        }
      : {}),

    ...(paymentStatus !== 'all'
      ? {
          paymentStatus: paymentStatus as ReservationPaymentStatus,
        }
      : {}),
  };

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: 30,
    include: {
      seating: true,
      invoice: true,
    },
  });

  return res.status(200).json({
    reservations: reservations.map((reservation) => ({
      id: reservation.id,
      name: reservation.name,
      email: reservation.email,
      people: reservation.people,
      type: reservation.type,
      paymentStatus: reservation.paymentStatus,
      paidAt: reservation.paidAt?.toISOString() ?? null,
      minimumSpend: reservation.minimumSpend,
      tableNumber: reservation.tableNumber,
      createdAt: reservation.createdAt.toISOString(),

      seatingId: reservation.seatingId,
      seating: reservation.seating,

      invoice: reservation.invoice
        ? {
            id: reservation.invoice.id,
            invoiceNumber: reservation.invoice.invoiceNumber,
            issuedAt: reservation.invoice.issuedAt.toISOString(),
            sentAt: reservation.invoice.sentAt?.toISOString() ?? null,
            totalCents: reservation.invoice.totalCents,
          }
        : null,
    })),
  });
}
