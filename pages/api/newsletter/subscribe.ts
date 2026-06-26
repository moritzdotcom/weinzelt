import { createNewsletterSubscription } from '@/lib/newsletter';
import type { NextApiRequest, NextApiResponse } from 'next';

type ApiResponse = {
  success: boolean;
  message: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { email, name } = req.body || {};

  if (typeof email !== 'string' || !isValidEmail(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Bitte gib eine gültige E-Mail Adresse ein.',
    });
  }

  if (
    name !== undefined &&
    name !== null &&
    (typeof name !== 'string' || name.length > 120)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Bitte gib einen gültigen Namen ein.',
    });
  }

  await createNewsletterSubscription(
    email.trim().toLowerCase(),
    typeof name === 'string' ? name.trim() : null,
  );

  return res.status(200).json({
    success: true,
    message:
      'Wenn diese E-Mail Adresse noch nicht angemeldet ist, erhältst du gleich eine Bestätigungsmail.',
  });
}
