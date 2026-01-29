import prisma from '@/lib/prismadb';
import sendDoubleOptInMail from './mailer/doubleOptInMail';
import { Prisma } from '@prisma/client';

export async function createNewsletterSubscription(
  email: string,
  name?: string | null,
) {
  try {
    const { id } = await prisma.newsletterSubscription.create({
      data: {
        email,
        name: name?.trim() || null,
      },
    });
    await sendDoubleOptInMail(
      email,
      `${process.env.APP_URL}/newsletter/confirm?id=${id}`,
      name,
    );
    return id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code !== 'P2002')
        console.error('Error creating newsletter subscription:', error);
    }
  }
  return null;
}
