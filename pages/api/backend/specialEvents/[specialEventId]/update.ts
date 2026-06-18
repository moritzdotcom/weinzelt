import type { NextApiRequest, NextApiResponse } from 'next';
import { readFile } from 'node:fs/promises';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/session';
import { validateSpecialEventPayload } from '@/lib/specialEvents/validator';
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req);

    if (!session) {
      return res.status(401).json({
        error: 'Nicht autorisiert.',
      });
    }

    const specialEventId = String(req.query.specialEventId);
    const { fields, files } = await parseSpecialEventForm(req);

    const titleImage = getFirstFile(files.titleImage);
    const attachment = getFirstFile(files.attachment);

    const validation = validateSpecialEventPayload({
      name: firstField(fields, 'name'),
      description: firstField(fields, 'description'),
      eventDateId: firstField(fields, 'eventDateId'),
      startTime: firstField(fields, 'startTime'),
      endTime: firstField(fields, 'endTime'),
      category: firstField(fields, 'category'),
      badge: firstField(fields, 'badge') || undefined,
      ctaLabel: firstField(fields, 'ctaLabel'),
      bookingType: firstField(fields, 'bookingType'),
      externalUrl: firstField(fields, 'externalUrl') || undefined,
      priceCents: parseOptionalNumber(firstField(fields, 'priceCents')),
      priceLabel: firstField(fields, 'priceLabel') || undefined,
      capacity: parseOptionalNumber(firstField(fields, 'capacity')),
      maxPersonsPerRegistration:
        parseOptionalNumber(firstField(fields, 'maxPersonsPerRegistration')) ??
        10,
      sortOrder: parseOptionalNumber(firstField(fields, 'sortOrder')) ?? 0,
      isPublished: parseBoolean(firstField(fields, 'isPublished')),
      removeTitleImage: parseBoolean(firstField(fields, 'removeTitleImage')),
      attachmentLabel: firstField(fields, 'attachmentLabel') || undefined,
      removeAttachment: parseBoolean(firstField(fields, 'removeAttachment')),
    });

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Die Eingaben sind nicht vollständig oder ungültig.',
        details: validation.errors,
      });
    }

    const payload = validation.payload;

    const existingEvent = await prisma.specialEvent.findUnique({
      where: {
        id: specialEventId,
      },
      select: {
        id: true,
        titleImagePath: true,
        attachmentPath: true,
      },
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: 'Das WineEvent wurde nicht gefunden.',
      });
    }

    let titleImagePath = existingEvent.titleImagePath;

    if (payload.removeTitleImage && titleImagePath) {
      await supabase.storage.from('Weinzelt').remove([titleImagePath]);
      titleImagePath = null;
    }

    if (titleImage) {
      const extension = getSafeImageExtension(titleImage);
      const nextTitleImagePath = `specialEvents/${specialEventId}/titleImage.${extension}`;

      const fileBuffer = await readFile(titleImage.filepath);

      const { error: uploadError } = await supabase.storage
        .from('Weinzelt')
        .upload(nextTitleImagePath, fileBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: titleImage.mimetype || 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      if (titleImagePath && titleImagePath !== nextTitleImagePath) {
        await supabase.storage.from('Weinzelt').remove([titleImagePath]);
      }

      titleImagePath = nextTitleImagePath;
    }

    let attachmentPath = existingEvent.attachmentPath;

    if (payload.removeAttachment && attachmentPath) {
      await supabase.storage.from('Weinzelt').remove([attachmentPath]);
      attachmentPath = null;
    }

    if (attachment) {
      if (!isAllowedAttachment(attachment)) {
        return res.status(400).json({
          error: 'Der Anhang muss eine PDF- oder Bilddatei sein.',
        });
      }

      const extension = getSafeAttachmentExtension(attachment);
      const nextAttachmentPath = `specialEvents/${specialEventId}/attachment.${extension}`;

      const fileBuffer = await readFile(attachment.filepath);

      const { error: uploadError } = await supabase.storage
        .from('Weinzelt')
        .upload(nextAttachmentPath, fileBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: attachment.mimetype || 'application/pdf',
        });

      if (uploadError) {
        throw uploadError;
      }

      if (attachmentPath && attachmentPath !== nextAttachmentPath) {
        await supabase.storage.from('Weinzelt').remove([attachmentPath]);
      }

      attachmentPath = nextAttachmentPath;
    }

    const updatedEvent = await prisma.specialEvent.update({
      where: {
        id: specialEventId,
      },
      data: {
        name: payload.name,
        description: payload.description,
        eventDateId: payload.eventDateId,
        startTime: payload.startTime,
        endTime: payload.endTime,
        category: payload.category,
        badge: payload.badge || null,
        ctaLabel: payload.ctaLabel,
        bookingType: payload.bookingType,
        externalUrl:
          payload.bookingType === 'EXTERNAL_LINK' ? payload.externalUrl : null,
        priceCents: payload.priceCents,
        priceLabel: payload.priceLabel || null,
        capacity:
          payload.bookingType === 'INTERNAL_REGISTRATION'
            ? payload.capacity
            : null,
        maxPersonsPerRegistration: payload.maxPersonsPerRegistration,
        sortOrder: payload.sortOrder,
        isPublished: payload.isPublished,
        titleImagePath,

        attachmentPath,
        attachmentLabel: payload.attachmentLabel || null,
      },
      select: {
        id: true,
      },
    });

    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error(error);

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return res.status(401).json({
        error: 'Nicht autorisiert.',
      });
    }

    return res.status(500).json({
      error: 'Das WineEvent konnte nicht gespeichert werden.',
    });
  }
}
