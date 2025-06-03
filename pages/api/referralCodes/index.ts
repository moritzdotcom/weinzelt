import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    await handleGET(req, res);
  } else if (req.method === 'POST') {
    await handlePOST(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetReferralCodesResponse = Prisma.ReferralCodeGetPayload<{}>[];

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const referralCodes = await prisma.referralCode.findMany();
  return res.json(referralCodes);
}

export type ApiPostReferralCodeResponse = {
  id: string;
  createdAt: Date;
  code: string;
  valid: boolean;
  description: string;
};

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { code, description } = req.body;
  if (!code) return res.status(401).json('Code required');
  if (!description) return res.status(401).json('Description required');

  const referralCode = await prisma.referralCode.create({
    data: { code, description },
  });

  return res.json(referralCode);
}
