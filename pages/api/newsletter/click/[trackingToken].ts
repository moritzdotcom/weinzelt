import prisma from '@/lib/prismadb';
import type { NextApiRequest, NextApiResponse } from 'next';

const FALLBACK_URL =
  process.env.APP_URL?.replace(/\/$/, '') || 'https://dasweinzelt.de';

function getSafeRedirectUrl(value?: string | null) {
  if (!value) return FALLBACK_URL;

  try {
    const url = new URL(value);

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return FALLBACK_URL;
    }

    return url.toString();
  } catch {
    return FALLBACK_URL;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const trackingToken = req.query.trackingToken;

  if (typeof trackingToken !== 'string') {
    return res.redirect(302, FALLBACK_URL);
  }

  const recipient = await prisma.newsletterRecipient.findUnique({
    where: {
      trackingToken,
    },
    select: {
      id: true,
      newsletter: {
        select: {
          ctaUrl: true,
        },
      },
    },
  });

  if (!recipient) {
    return res.redirect(302, FALLBACK_URL);
  }

  await prisma.$transaction([
    prisma.newsletterRecipient.update({
      where: {
        id: recipient.id,
      },
      data: {
        ctaClickedAt: new Date(),
        ctaClickCount: {
          increment: 1,
        },
      },
    }),
    prisma.newsletterClick.create({
      data: {
        newsletterRecipientId: recipient.id,
      },
    }),
  ]);

  return res.redirect(302, getSafeRedirectUrl(recipient.newsletter.ctaUrl));
}
