import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { Prisma } from '@prisma/client';

export type ApiUpsertExternalTicketConfigResponse =
  | {
      id: string;
      name: string;
      ticketPrice: number;
      required: boolean;
      ticketPerPerson: boolean;
    }
  | { error: string };

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<ApiUpsertExternalTicketConfigResponse>,
) {
  const { seatingId } = req.query;

  if (typeof seatingId !== 'string') {
    return res.status(400).json({ error: 'Invalid seatingId' });
  }

  const session = await getServerSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PUT') {
    return handlePUT(req, res, seatingId);
  }

  if (req.method === 'DELETE') {
    return handleDELETE(req, res, seatingId);
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).end();
}

export type ApiPutExternalTicketConfigResponse =
  Prisma.ExternalTicketConfigGetPayload<{}>;

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse<ApiUpsertExternalTicketConfigResponse>,
  seatingId: string,
) {
  const { name, ticketPrice, required, ticketPerPerson } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Name missing' });
  }

  if (
    typeof ticketPrice !== 'number' ||
    isNaN(ticketPrice) ||
    ticketPrice < 0
  ) {
    return res.status(400).json({ error: 'Invalid ticket price' });
  }

  // Sicherstellen dass Seating existiert
  const seating = await prisma.seating.findUnique({
    where: { id: seatingId },
    select: { id: true },
  });

  if (!seating) {
    return res.status(404).json({ error: 'Seating not found' });
  }

  const config = await prisma.externalTicketConfig.upsert({
    where: {
      seatingId,
    },
    update: {
      name: name.trim(),
      ticketPrice,
      required: Boolean(required),
      ticketPerPerson: Boolean(ticketPerPerson),
    },
    create: {
      seatingId,
      name: name.trim(),
      ticketPrice,
      required: Boolean(required),
      ticketPerPerson: Boolean(ticketPerPerson),
    },
  });

  return res.status(200).json(config);
}

async function handleDELETE(
  req: NextApiRequest,
  res: NextApiResponse,
  seatingId: string,
) {
  await prisma.externalTicketConfig.delete({
    where: {
      seatingId,
    },
  });

  return res.status(200).json(null);
}
