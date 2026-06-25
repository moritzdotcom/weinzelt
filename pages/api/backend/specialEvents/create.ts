import type { NextApiRequest, NextApiResponse } from 'next';
import { readFile } from 'node:fs/promises';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import {
  parseOccurrences,
  validateSpecialEventPayload,
} from '@/lib/specialEvents/validator';
import {
  firstField,
  getFirstFile,
  parseSpecialEventForm,
  getSafeAttachmentExtension,
  isAllowedAttachment,
  getSafeImageExtension,
  parseBoolean,
  parseOptionalNumber,
} from '@/lib/specialEvents/upload';

export const config = {
  api: {
    bodyParser: false,
  },
};

type ApiResponse =
  | {
      id: string;
    }
  | {
      error: string;
      details?: unknown;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getServerSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { fields, files } = await parseSpecialEventForm(req);

    const titleImage = getFirstFile(files.titleImage);
    const attachment = getFirstFile(files.attachment);

    const validation = validateSpecialEventPayload({
      name: firstField(fields, 'name'),
      description: firstField(fields, 'description'),
      category: firstField(fields, 'category'),
      badge: firstField(fields, 'badge') || undefined,
      ctaLabel: firstField(fields, 'ctaLabel'),
      bookingType: firstField(fields, 'bookingType'),
      externalUrl: firstField(fields, 'externalUrl') || undefined,
      priceCents: parseOptionalNumber(firstField(fields, 'priceCents')),
      priceLabel: firstField(fields, 'priceLabel') || undefined,
      maxPersonsPerRegistration:
        parseOptionalNumber(firstField(fields, 'maxPersonsPerRegistration')) ??
        10,
      isPublished: parseBoolean(firstField(fields, 'isPublished')),
      attachmentLabel: firstField(fields, 'attachmentLabel') || undefined,
      removeTitleImage: false,
      removeAttachment: false,
    });

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Die Eingaben sind nicht vollständig oder ungültig.',
        details: validation.errors,
      });
    }

    const occurrences = parseOccurrences(firstField(fields, 'occurrences'));

    if (occurrences.length === 0) {
      return res.status(400).json({
        error: 'Bitte wähle mindestens einen Veranstaltungstag aus.',
      });
    }

    const payload = validation.payload;

    const specialEvent = await prisma.specialEvent.create({
      data: {
        eventId: payload.eventId,
        name: payload.name,
        description: payload.description,
        category: payload.category,
        badge: payload.badge ?? null,
        ctaLabel: payload.ctaLabel,
        bookingType: payload.bookingType,
        externalUrl: payload.externalUrl ?? null,
        priceCents: payload.priceCents,
        priceLabel: payload.priceLabel ?? null,
        maxPersonsPerRegistration: payload.maxPersonsPerRegistration,
        isPublished: payload.isPublished,
        attachmentLabel: payload.attachmentLabel ?? null,
        occurrences: {
          create: occurrences.map((occurrence) => ({
            eventDateId: occurrence.eventDateId,
            startTime: occurrence.startTime,
            endTime: occurrence.endTime,
            capacity:
              payload.bookingType === 'INTERNAL_REGISTRATION'
                ? occurrence.capacity
                : null,
            sortOrder: occurrence.sortOrder,
          })),
        },
      },
      select: {
        id: true,
      },
    });

    if (!titleImage) {
      return res.status(201).json({ id: specialEvent.id });
    }

    try {
      let titleImagePath: string | null = null;
      let attachmentPath: string | null = null;

      if (titleImage) {
        const extension = getSafeImageExtension(titleImage);
        titleImagePath = `specialEvents/${specialEvent.id}/titleImage.${extension}`;

        const fileBuffer = await readFile(titleImage.filepath);

        const { error: uploadError } = await supabase.storage
          .from('Weinzelt')
          .upload(titleImagePath, fileBuffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: titleImage.mimetype || 'image/jpeg',
          });

        if (uploadError) throw uploadError;
      }

      if (attachment) {
        if (!isAllowedAttachment(attachment)) {
          throw new Error('INVALID_ATTACHMENT_TYPE');
        }

        const extension = getSafeAttachmentExtension(attachment);
        attachmentPath = `specialEvents/${specialEvent.id}/attachment.${extension}`;

        const fileBuffer = await readFile(attachment.filepath);

        const { error: uploadError } = await supabase.storage
          .from('Weinzelt')
          .upload(attachmentPath, fileBuffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: attachment.mimetype || 'application/pdf',
          });

        if (uploadError) throw uploadError;
      }

      if (titleImagePath || attachmentPath) {
        await prisma.specialEvent.update({
          where: {
            id: specialEvent.id,
          },
          data: {
            titleImagePath,
            attachmentPath,
          },
        });
      }

      return res.status(201).json({ id: specialEvent.id });
    } catch (uploadError) {
      await prisma.specialEvent.delete({
        where: {
          id: specialEvent.id,
        },
      });

      throw uploadError;
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Das WineEvent konnte nicht angelegt werden.',
    });
  }
}
