import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  const { eventId } = req.query;
  if (typeof eventId !== 'string')
    return res.status(401).json('Event required');

  if (req.method === 'GET') {
    await handleGET(req, res, eventId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`,
    );
  }
}

export type ApiGetCompanyReservationsResponse =
  Prisma.CompanyReservationGetPayload<{
    include: {
      seating: {
        include: {
          eventDate: { select: { date: true } };
          reservations: { select: { type: true; tableCount: true } };
        };
      };
      responsible: {
        select: { name: true; email: true; id: true };
      };
    };
  }>[];

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
) {
  const reservations = await prisma.companyReservation.findMany({
    include: {
      seating: {
        include: {
          eventDate: { select: { date: true } },
          reservations: {
            select: { type: true, tableCount: true },
            where: {
              paymentStatus: 'PAID',
            },
          },
        },
      },
      responsible: {
        select: { name: true, email: true, id: true },
      },
    },
    where: { seating: { eventDate: { eventId: id } } },
  });
  return res.json(reservations);
}
