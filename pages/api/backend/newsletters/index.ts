import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { validateNewsletterPayload } from '@/lib/validateNewsletterPayload';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);

  if (!session) {
    return res.status(401).json({
      error: 'Nicht autorisiert.',
    });
  }

  if (req.method === 'GET') {
    const [newsletters, subscriptions] = await Promise.all([
      prisma.newsletter.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
        include: {
          _count: {
            select: {
              recipients: true,
            },
          },
        },
      }),
      prisma.newsletterSubscription.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      }),
    ]);

    return res.status(200).json({
      newsletters,
      subscriptions,
    });
  }

  if (req.method === 'POST') {
    const validation = validateNewsletterPayload(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Bitte prüfe deine Eingaben.',
        details: validation.errors,
      });
    }

    const newsletter = await prisma.newsletter.create({
      data: validation.data,
    });

    return res.status(201).json({
      newsletter,
    });
  }

  res.setHeader('Allow', 'GET, POST');

  return res.status(405).json({
    error: 'Method not allowed',
  });
}
