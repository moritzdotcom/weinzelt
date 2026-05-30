import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File, Fields } from 'formidable';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';
import { SpecialEventBookingType, SpecialEventCategory } from '@prisma/client';

export const config = {
  api: {
    bodyParser: false,
  },
};

function firstField(fields: Fields, key: string) {
  const value = fields[key];

  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: string) {
  return value === 'true';
}

function getFirstFile(file: File | File[] | undefined) {
  if (!file) return null;
  return Array.isArray(file) ? (file[0] ?? null) : file;
}

function getSafeImageExtension(file: File) {
  const extension = path
    .extname(file.originalFilename ?? '')
    .replace('.', '')
    .toLowerCase();

  if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
    return extension === 'jpeg' ? 'jpg' : extension;
  }

  switch (file.mimetype) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

async function parseForm(req: NextApiRequest) {
  const form = formidable({
    multiples: false,
    maxFiles: 1,
    maxFileSize: 8 * 1024 * 1024,
    filter: ({ mimetype }) => Boolean(mimetype?.startsWith('image/')),
  });

  return new Promise<{
    fields: Fields;
    files: formidable.Files;
  }>((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ fields, files });
    });
  });
}

/**
 * Durch deinen bestehenden Backend-Session-Guard ersetzen.
 */
async function requireBackendAdmin(
  _req: NextApiRequest,
  _res: NextApiResponse,
) {
  // Beispiel:
  // const session = await getSession(req, res);
  // if (!session?.user) throw new Error('UNAUTHORIZED');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireBackendAdmin(req, res);

    const specialEventId = String(req.query.specialEventId);
    const { fields, files } = await parseForm(req);
    const titleImage = getFirstFile(files.titleImage);

    const payload = {
      name: firstField(fields, 'name'),
      description: firstField(fields, 'description'),
      eventDateId: firstField(fields, 'eventDateId'),
      startTime: firstField(fields, 'startTime'),
      endTime: firstField(fields, 'endTime'),
      category: firstField(fields, 'category') as SpecialEventCategory,
      badge: firstField(fields, 'badge') || undefined,
      ctaLabel: firstField(fields, 'ctaLabel'),
      bookingType: firstField(fields, 'bookingType') as SpecialEventBookingType,
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
    };

    const existingEvent = await prisma.specialEvent.findUnique({
      where: {
        id: specialEventId,
      },
      select: {
        id: true,
        titleImagePath: true,
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
