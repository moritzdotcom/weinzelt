import prisma from '@/lib/prismadb';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const unsubscribeToken = req.query.unsubscribeToken;

  if (typeof unsubscribeToken !== 'string') {
    return res.status(400).json({
      error: 'Ungültiger Link.',
    });
  }

  const result = await prisma.newsletterSubscription.updateMany({
    where: {
      unsubscribeToken,
      unsubscribedAt: null,
    },
    data: {
      unsubscribedAt: new Date(),
    },
  });

  return res.status(200).json({
    success: true,
    changed: result.count > 0,
  });
}
