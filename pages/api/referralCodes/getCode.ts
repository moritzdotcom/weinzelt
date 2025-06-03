import prisma from '@/lib/prismadb';
import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    await handleGET(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetReferralCodeResponse = Prisma.ReferralCodeGetPayload<{}>;

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  if (typeof code !== 'string') return res.status(401).json('Invalid Code');
  const referralCode = await prisma.referralCode.findUnique({
    where: { code },
  });
  return res.json(referralCode);
}
