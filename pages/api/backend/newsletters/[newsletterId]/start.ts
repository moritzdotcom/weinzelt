import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { randomUUID } from 'crypto';
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

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const newsletterId = req.query.newsletterId;

  if (typeof newsletterId !== 'string') {
    return res.status(400).json({
      error: 'Es wurde kein Newsletter angegeben.',
    });
  }

  const newsletter = await prisma.newsletter.findUnique({
    where: {
      id: newsletterId,
    },
  });

  if (!newsletter) {
    return res.status(404).json({
      error: 'Der Newsletter wurde nicht gefunden.',
    });
  }

  if (newsletter.status !== 'DRAFT') {
    return res.status(400).json({
      error: 'Der Versand wurde bereits gestartet.',
    });
  }

  const subscriptions = await prisma.newsletterSubscription.findMany({
    where: {
      confirmed: true,
      unsubscribedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      email: true,
      name: true,
      unsubscribeToken: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    const updateResult = await tx.newsletter.updateMany({
      where: {
        id: newsletterId,
        status: 'DRAFT',
      },
      data: {
        status: subscriptions.length > 0 ? 'SENDING' : 'SENT',
        startedAt: new Date(),
        sentAt: subscriptions.length > 0 ? null : new Date(),
      },
    });

    if (updateResult.count !== 1) {
      throw new Error('Der Versand wurde bereits gestartet.');
    }

    if (subscriptions.length > 0) {
      await tx.newsletterRecipient.createMany({
        data: subscriptions.map((subscription) => ({
          newsletterId,
          subscriptionId: subscription.id,
          email: subscription.email,
          name: subscription.name,
          unsubscribeToken: subscription.unsubscribeToken ?? randomUUID(),
        })),
      });
    }
  });

  return res.status(200).json({
    recipientCount: subscriptions.length,
    done: subscriptions.length === 0,
  });
}
