import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import type { NextApiRequest, NextApiResponse } from 'next';

type Recipient = {
  id: string;
  email: string;
  name?: string | null;
  status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
  attemptCount: number;
  sentAt?: string | null;
  failureReason?: string | null;
  ctaClickCount: number;
};

export type ApiGetNewsletterBackendResponse = {
  newsletter: {
    id: string;
    subject: string;
    headline: string;
    body: string;
    imageUrl?: string | null;
    ctaLabel?: string | null;
    ctaUrl?: string | null;
    status: 'DRAFT' | 'SENDING' | 'SENT';
    createdAt: string;
    startedAt?: string | null;
    sentAt?: string | null;
    recipients: Recipient[];
  };
  stats: {
    total: number;
    pending: number;
    sending: number;
    sent: number;
    failed: number;
    totalClicks: number;
    uniqueClickRecipients: number;
  };
};

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

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

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
    include: {
      recipients: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 500,
        include: {
          _count: {
            select: {
              ctaClicks: true,
            },
          },
        },
      },
    },
  });

  if (!newsletter) {
    return res.status(404).json({
      error: 'Der Newsletter wurde nicht gefunden.',
    });
  }

  const [pending, sending, sent, failed, totalClicks, uniqueClickRecipients] =
    await Promise.all([
      prisma.newsletterRecipient.count({
        where: {
          newsletterId,
          status: 'PENDING',
        },
      }),
      prisma.newsletterRecipient.count({
        where: {
          newsletterId,
          status: 'SENDING',
        },
      }),
      prisma.newsletterRecipient.count({
        where: {
          newsletterId,
          status: 'SENT',
        },
      }),
      prisma.newsletterRecipient.count({
        where: {
          newsletterId,
          status: 'FAILED',
        },
      }),
      prisma.newsletterClick.count({
        where: {
          newsletterRecipient: {
            newsletterId,
          },
        },
      }),
      prisma.newsletterRecipient.count({
        where: {
          newsletterId,
          ctaClickCount: {
            gt: 0,
          },
        },
      }),
    ]);

  return res.status(200).json({
    newsletter,
    stats: {
      total: newsletter.recipients.length,
      pending,
      sending,
      sent,
      failed,
      totalClicks,
      uniqueClickRecipients,
    },
  });
}
