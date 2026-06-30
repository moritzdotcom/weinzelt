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

function getNewsletterId(req: NextApiRequest) {
  return typeof req.query.newsletterId === 'string'
    ? req.query.newsletterId
    : undefined;
}

export type ApiGetNewsletterBackendResponse = {
  newsletter: Awaited<ReturnType<typeof getNewsletterById>>;
};

async function getNewsletterById(newsletterId: string) {
  return prisma.newsletter.findUnique({
    where: {
      id: newsletterId,
    },
    include: {
      _count: {
        select: {
          recipients: true,
        },
      },
      recipients: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
        include: {
          subscription: true,
        },
      },
    },
  });
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

  const newsletterId = getNewsletterId(req);

  if (!newsletterId) {
    return res.status(400).json({
      error: 'Ungültige Newsletter-ID.',
    });
  }

  if (req.method === 'GET') {
    const newsletter = await getNewsletterById(newsletterId);

    if (!newsletter) {
      return res.status(404).json({
        error: 'Newsletter nicht gefunden.',
      });
    }

    return res.status(200).json({
      newsletter,
    });
  }

  if (req.method === 'PUT') {
    let uploadedImagePath: string | undefined;

    try {
      const existingNewsletter = await prisma.newsletter.findUnique({
        where: {
          id: newsletterId,
        },
      });

      if (!existingNewsletter) {
        return res.status(404).json({
          error: 'Newsletter nicht gefunden.',
        });
      }

      if (existingNewsletter.sentAt) {
        return res.status(409).json({
          error:
            'Bereits versendete Newsletter können nicht mehr bearbeitet werden.',
        });
      }

      const { fields, files } = await parseMultipartForm(req);

      const validation = validateNewsletterPayload({
        subject: firstField(fields, 'subject'),
        headline: firstField(fields, 'headline'),
        body: firstField(fields, 'body'),
        ctaLabel: firstField(fields, 'ctaLabel'),
        ctaUrl: firstField(fields, 'ctaUrl'),

        /*
         * Die Bild-URL wird nicht vom Browser übernommen.
         * Sie wird nach Upload oder Löschung serverseitig gesetzt.
         */
        imageUrl: undefined,
      });

      if (!validation.success) {
        return res.status(400).json({
          error: 'Bitte prüfe deine Eingaben.',
          details: validation.errors,
        });
      }

      const titleImage = firstFile(files, 'titleImage');
      const removeTitleImage =
        firstField(fields, 'removeTitleImage') === 'true';

      let nextImageUrl: string | null | undefined = undefined;
      let nextImagePath: string | null | undefined = undefined;
      let oldImagePathToDelete: string | null = null;

      /*
       * Neue Datei gewinnt gegenüber removeTitleImage.
       * Falls also aus Versehen beides kommt, wird das Bild ersetzt,
       * nicht gelöscht.
       */
      if (titleImage) {
        const uploadedImage = await uploadNewsletterImage({
          newsletterId,
          image: titleImage,
        });

        nextImageUrl = uploadedImage.imageUrl;
        nextImagePath = uploadedImage.imagePath;
        uploadedImagePath = uploadedImage.imagePath;

        oldImagePathToDelete = existingNewsletter.imagePath;
      } else if (removeTitleImage) {
        nextImageUrl = null;
        nextImagePath = null;

        oldImagePathToDelete = existingNewsletter.imagePath;
      }

      const newsletter = await prisma.newsletter.update({
        where: {
          id: newsletterId,
        },
        data: {
          ...validation.data,

          ...(nextImageUrl !== undefined
            ? {
                imageUrl: nextImageUrl,
                imagePath: nextImagePath,
              }
            : {}),
        },
      });

      /*
       * Erst nach erfolgreichem DB-Update löschen.
       * So bleibt das alte Bild erhalten, falls das Speichern fehlschlägt.
       */
      if (oldImagePathToDelete) {
        try {
          await deleteNewsletterImage(oldImagePathToDelete);
        } catch (deleteError) {
          console.error(
            'Old newsletter image could not be deleted:',
            deleteError,
          );
        }
      }

      return res.status(200).json({
        newsletter,
      });
    } catch (error) {
      /*
       * Falls ein neues Bild bereits hochgeladen wurde, der DB-Update aber
       * fehlschlägt, entfernen wir die verwaiste Storage-Datei wieder.
       */
      if (uploadedImagePath) {
        try {
          await deleteNewsletterImage(uploadedImagePath);
        } catch (deleteError) {
          console.error(
            'Uploaded newsletter image could not be cleaned up:',
            deleteError,
          );
        }
      }

      console.error('Newsletter update failed:', error);

      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Der Newsletter konnte nicht gespeichert werden.',
      });
    }
  }

  res.setHeader('Allow', 'GET, PUT');

  return res.status(405).json({
    error: 'Method not allowed',
  });
}
