import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';

import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';

export type ReceiptInvoiceCorrectionListItem = {
  id: string;
  documentNumber: string;

  receiptNumber: string;
  receiptDate: string;
  tableNumber: string | null;

  recipientCompany: string;
  recipientEmail: string | null;

  grossCents: number;
  currency: string;

  createdAt: string;

  reservation: {
    id: string;
    name: string;
    email: string;
    people: number;
    type: string;
    tableNumber: string | null;
  };
};

export type ApiReceiptInvoiceCorrectionsListResponse = {
  corrections: ReceiptInvoiceCorrectionListItem[];
  total: number;
  page: number;
  pageSize: number;
};

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(23, 59, 59, 999);
  return result;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | ApiReceiptInvoiceCorrectionsListResponse
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

  const page = Math.max(Number(req.query.page ?? 1), 1);

  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 25), 1), 100);

  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);

  const where: Prisma.ReceiptInvoiceSupplementWhereInput = {
    ...(from || to
      ? {
          createdAt: {
            ...(from
              ? {
                  gte: from,
                }
              : {}),
            ...(to
              ? {
                  lte: endOfDay(to),
                }
              : {}),
          },
        }
      : {}),

    ...(q
      ? {
          OR: [
            {
              documentNumber: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              receiptNumber: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              recipientCompany: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              recipientEmail: {
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
  };

  try {
    const [total, corrections] = await Promise.all([
      prisma.receiptInvoiceSupplement.count({
        where,
      }),

      prisma.receiptInvoiceSupplement.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          documentNumber: true,

          receiptNumber: true,
          receiptDate: true,
          tableNumber: true,

          recipientCompany: true,
          recipientEmail: true,

          grossCents: true,
          currency: true,

          createdAt: true,

          reservation: {
            select: {
              id: true,
              name: true,
              email: true,
              people: true,
              type: true,
              tableNumber: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      total,
      page,
      pageSize,

      corrections: corrections.map((correction) => ({
        id: correction.id,
        documentNumber: correction.documentNumber,

        receiptNumber: correction.receiptNumber,
        receiptDate: correction.receiptDate.toISOString(),
        tableNumber: correction.tableNumber,

        recipientCompany: correction.recipientCompany,
        recipientEmail: correction.recipientEmail,

        grossCents: correction.grossCents,
        currency: correction.currency,

        createdAt: correction.createdAt.toISOString(),

        reservation: {
          id: correction.reservation.id,
          name: correction.reservation.name,
          email: correction.reservation.email,
          people: correction.reservation.people,
          type: correction.reservation.type,
          tableNumber: correction.reservation.tableNumber,
        },
      })),
    });
  } catch (error) {
    console.error('Receipt invoice corrections could not be loaded:', error);

    return res.status(500).json({
      message: 'Rechnungskorrekturen konnten nicht geladen werden.',
    });
  }
}
