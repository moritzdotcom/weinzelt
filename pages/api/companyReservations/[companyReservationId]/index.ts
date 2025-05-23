import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');
  const { companyReservationId } = req.query;
  if (typeof companyReservationId !== 'string')
    return res.status(401).json('Event required');

  if (req.method === 'PUT') {
    await handlePUT(req, res, companyReservationId);
  } else if (req.method === 'DELETE') {
    await handleDELETE(req, res, companyReservationId);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { responsibleId } = req.body;

  if (typeof responsibleId !== 'string')
    return res.status(401).json('Responsible required');

  const companyReservation = await prisma.companyReservation.update({
    where: { id },
    data: {
      userId: responsibleId,
    },
  });

  return res.json(companyReservation);
}

async function handleDELETE(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const companyReservation = await prisma.companyReservation.delete({
    where: { id },
  });

  return res.json(companyReservation);
}
