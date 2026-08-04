import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';

import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import {
  normalizeBillingAddress,
  type ReceiptInvoiceReservationSearchResponse,
} from '@/lib/receiptInvoice/types';

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
    res.setHeader('Allow', 'GET');

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

  try {
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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Reservierungen konnten nicht geladen werden.',
    });
  }
}
