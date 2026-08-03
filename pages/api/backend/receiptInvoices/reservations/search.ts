import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma, ReservationPaymentStatus } from '@prisma/client';

import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import {
  normalizeBillingAddress,
  type BillingAddressInput,
} from '@/lib/receiptInvoice/types';

export type ReceiptInvoiceReservationSearchItem = {
  id: string;
  name: string;
  email: string;
  people: number;
  type: string;
  paymentStatus: ReservationPaymentStatus;
  tableNumber: string | null;
  createdAt: string;
  billingAddress: BillingAddressInput | null;
};

export type ReceiptInvoiceReservationSearchResponse = {
  reservations: ReceiptInvoiceReservationSearchItem[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | ReceiptInvoiceReservationSearchResponse
    | {
        message: string;
      }
  >,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const session = await getServerSession(req);

  if (!session) {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const where: Prisma.ReservationWhereInput = q
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
        ],
      }
    : {};

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: 30,
    select: {
      id: true,
      name: true,
      email: true,
      people: true,
      type: true,
      paymentStatus: true,
      tableNumber: true,
      createdAt: true,
      billingAddress: true,
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
      tableNumber: reservation.tableNumber,
      createdAt: reservation.createdAt.toISOString(),
      billingAddress: normalizeBillingAddress(reservation.billingAddress),
    })),
  });
}
