import { randomUUID } from 'crypto';
import sendNewsletterMail from '@/lib/mailer/newsletterMail';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import type { NextApiRequest, NextApiResponse } from 'next';

const BATCH_SIZE = 10;
const MAX_CONCURRENT_MAILS = 3;
const MAX_AUTOMATIC_ATTEMPTS = 3;
const STALE_CLAIM_MINUTES = 10;

export type ApiSendNewsletterBatchResponse = {
  attempted: number;
  sent: number;
  failed: number;
  remaining: number;
  permanentlyFailed: number;
  done: boolean;
};

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function splitIntoChunks<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return 'Unbekannter Fehler beim Versand';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSendNewsletterBatchResponse | { error: string }>,
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

  if (newsletter.status === 'DRAFT') {
    return res.status(400).json({
      error: 'Der Versand wurde noch nicht gestartet.',
    });
  }

  if (newsletter.status === 'SENT') {
    return res.status(200).json({
      attempted: 0,
      sent: 0,
      failed: 0,
      remaining: 0,
      permanentlyFailed: 0,
      done: true,
    });
  }

  const claimToken = randomUUID();
  const staleBefore = new Date(Date.now() - STALE_CLAIM_MINUTES * 60 * 1000);

  const recipients = await prisma.$transaction(async (tx) => {
    const claimableRecipients = await tx.newsletterRecipient.findMany({
      where: {
        newsletterId,
        attemptCount: {
          lt: MAX_AUTOMATIC_ATTEMPTS,
        },
        OR: [
          {
            status: 'PENDING',
          },
          {
            status: 'FAILED',
          },
          {
            status: 'SENDING',
            sendingAt: {
              lt: staleBefore,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: BATCH_SIZE,
      select: {
        id: true,
      },
    });

    if (claimableRecipients.length === 0) {
      return [];
    }

    await tx.newsletterRecipient.updateMany({
      where: {
        id: {
          in: claimableRecipients.map((recipient) => recipient.id),
        },
        newsletterId,
        attemptCount: {
          lt: MAX_AUTOMATIC_ATTEMPTS,
        },
        OR: [
          {
            status: 'PENDING',
          },
          {
            status: 'FAILED',
          },
          {
            status: 'SENDING',
            sendingAt: {
              lt: staleBefore,
            },
          },
        ],
      },
      data: {
        status: 'SENDING',
        claimToken,
        sendingAt: new Date(),
      },
    });

    return tx.newsletterRecipient.findMany({
      where: {
        newsletterId,
        claimToken,
      },
      select: {
        id: true,
        email: true,
        name: true,
        trackingToken: true,
        unsubscribeToken: true,
      },
    });
  });

  let sent = 0;
  let failed = 0;

  const chunks = splitIntoChunks(recipients, MAX_CONCURRENT_MAILS);

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(async (recipient) => {
        await prisma.newsletterRecipient.update({
          where: {
            id: recipient.id,
          },
          data: {
            attemptCount: {
              increment: 1,
            },
            lastAttemptAt: new Date(),
          },
        });

        const siteUrl =
          process.env.APP_URL?.replace(/\/$/, '') || 'https://dasweinzelt.de';

        await sendNewsletterMail({
          email: recipient.email,
          name: recipient.name,
          subject: newsletter.subject,
          headline: newsletter.headline,
          body: newsletter.body,
          imageUrl: newsletter.imageUrl,
          ctaLabel: newsletter.ctaLabel,
          ctaHref: newsletter.ctaLabel
            ? `${siteUrl}/api/newsletter/click/${recipient.trackingToken}`
            : undefined,
          unsubscribeUrl: `${siteUrl}/newsletter/unsubscribe/${recipient.unsubscribeToken}`,
        });

        await prisma.newsletterRecipient.update({
          where: {
            id: recipient.id,
          },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            failureReason: null,
            claimToken: null,
            sendingAt: null,
          },
        });

        return recipient.id;
      }),
    );

    for (const [index, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        sent += 1;
        continue;
      }

      failed += 1;

      await prisma.newsletterRecipient.update({
        where: {
          id: chunk[index].id,
        },
        data: {
          status: 'FAILED',
          failureReason: getErrorMessage(result.reason),
          claimToken: null,
          sendingAt: null,
        },
      });
    }

    if (chunks.length > 1) {
      await sleep(250);
    }
  }

  const [remaining, permanentlyFailed] = await Promise.all([
    prisma.newsletterRecipient.count({
      where: {
        newsletterId,
        status: {
          in: ['PENDING', 'FAILED'],
        },
        attemptCount: {
          lt: MAX_AUTOMATIC_ATTEMPTS,
        },
      },
    }),
    prisma.newsletterRecipient.count({
      where: {
        newsletterId,
        status: 'FAILED',
        attemptCount: {
          gte: MAX_AUTOMATIC_ATTEMPTS,
        },
      },
    }),
  ]);

  const done = remaining === 0;

  if (done) {
    await prisma.newsletter.update({
      where: {
        id: newsletterId,
      },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  return res.status(200).json({
    attempted: recipients.length,
    sent,
    failed,
    remaining,
    permanentlyFailed,
    done,
  });
}
