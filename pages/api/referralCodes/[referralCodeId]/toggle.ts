import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'POST') {
    await handlePOST(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiPostReferralCodeToggleResponse = {
  id: string;
  createdAt: Date;
  code: string;
  valid: boolean;
  description: string;
};

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { valid } = req.body;
  const { referralCodeId } = req.query;
  if (typeof referralCodeId !== 'string')
    return res.status(401).json('Event required');

  const referralCode = await prisma.referralCode.update({
    where: { id: referralCodeId },
    data: { valid },
  });

  return res.json(referralCode);
}
