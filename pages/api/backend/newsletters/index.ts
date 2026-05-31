import { randomUUID } from 'crypto';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { validateNewsletterPayload } from '@/lib/newsletter/validateNewsletterPayload';
import {
  deleteNewsletterImage,
  uploadNewsletterImage,
} from '@/lib/newsletter/uploadNewsletterImage';
import {
  firstField,
  firstFile,
  parseMultipartForm,
} from '@/lib/api/parseMultipartForm';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
  },
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
    let uploadedImagePath: string | undefined;

    try {
      const { fields, files } = await parseMultipartForm(req);

      const validation = validateNewsletterPayload({
        subject: firstField(fields, 'subject'),
        headline: firstField(fields, 'headline'),
        body: firstField(fields, 'body'),
        ctaLabel: firstField(fields, 'ctaLabel'),
        ctaUrl: firstField(fields, 'ctaUrl'),

        /*
         * Die Bild-URL wird nicht mehr vom Browser übermittelt,
         * sondern nach dem Upload serverseitig ergänzt.
         */
        imageUrl: undefined,
      });

      if (!validation.success) {
        return res.status(400).json({
          error: 'Bitte prüfe deine Eingaben.',
          details: validation.errors,
        });
      }

      const newsletterId = randomUUID();
      const titleImage = firstFile(files, 'titleImage');

      let imageUrl: string | undefined;

      if (titleImage) {
        const uploadedImage = await uploadNewsletterImage({
          newsletterId,
          image: titleImage,
        });

        imageUrl = uploadedImage.imageUrl;
        uploadedImagePath = uploadedImage.imagePath;
      }

      const newsletter = await prisma.newsletter.create({
        data: {
          id: newsletterId,
          ...validation.data,
          imageUrl,
          imagePath: uploadedImagePath,
        },
      });

      return res.status(201).json({
        newsletter,
      });
    } catch (error) {
      /*
       * Wurde das Bild bereits hochgeladen, der DB-Eintrag aber nicht
       * angelegt, entfernen wir die verwaiste Storage-Datei wieder.
       */
      if (uploadedImagePath) {
        await deleteNewsletterImage(uploadedImagePath);
      }

      console.error('Newsletter creation failed:', error);

      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Der Newsletter konnte nicht gespeichert werden.',
      });
    }
  }

  res.setHeader('Allow', 'GET, POST');

  return res.status(405).json({
    error: 'Method not allowed',
  });
}
