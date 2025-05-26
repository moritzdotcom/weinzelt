import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    await handleGET(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetPageVisitsResponse = Prisma.PageVisitGetPayload<{}>[];

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const pageVisits = await prisma.pageVisit.findMany();
  return res.json(pageVisits);
}
