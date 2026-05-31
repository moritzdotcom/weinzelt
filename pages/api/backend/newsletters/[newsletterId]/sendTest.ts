import sendNewsletterMail from '@/lib/mailer/newsletterMail';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import type { NextApiRequest, NextApiResponse } from 'next';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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

  const email =
    typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      error: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    });
  }

  const newsletter = await prisma.newsletter.findUnique({
    where: {
      id: newsletterId,
    },
    select: {
      subject: true,
      headline: true,
      body: true,
      imageUrl: true,
      ctaLabel: true,
      ctaUrl: true,
    },
  });

  if (!newsletter) {
    return res.status(404).json({
      error: 'Der Newsletter wurde nicht gefunden.',
    });
  }

  await sendNewsletterMail({
    email,
    subject: newsletter.subject,
    headline: newsletter.headline,
    body: newsletter.body,
    imageUrl: newsletter.imageUrl,
    ctaLabel: newsletter.ctaLabel,
    ctaHref: newsletter.ctaUrl,
    unsubscribeUrl: undefined,
    isTest: true,
  });

  return res.status(200).json({
    success: true,
  });
}
