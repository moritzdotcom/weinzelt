import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File, Fields } from 'formidable';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { validateSpecialEventPayload } from '@/lib/specialEvents/validator';

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

function firstField(fields: Fields, key: string) {
  const value = fields[key];

  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: string): boolean {
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
    const { fields, files } = await parseForm(req);
    const titleImage = getFirstFile(files.titleImage);

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
      removeTitleImage: false,
    });

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Die Eingaben sind nicht vollständig oder ungültig.',
        details: validation.errors,
      });
    }

    const payload = validation.payload;

    const specialEvent = await prisma.specialEvent.create({
      data: {
        ...payload,
        badge: payload.badge || null,
        externalUrl:
          payload.bookingType === 'EXTERNAL_LINK' ? payload.externalUrl : null,
        priceLabel: payload.priceLabel || null,
      },
      select: {
        id: true,
      },
    });

    if (!titleImage) {
      return res.status(201).json({ id: specialEvent.id });
    }

    try {
      const extension = getSafeImageExtension(titleImage);
      const titleImagePath = `specialEvents/${specialEvent.id}/titleImage.${extension}`;
      const fileBuffer = await readFile(titleImage.filepath);

      const { error: uploadError } = await supabase.storage
        .from('Weinzelt')
        .upload(titleImagePath, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: titleImage.mimetype || 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      await prisma.specialEvent.update({
        where: {
          id: specialEvent.id,
        },
        data: {
          titleImagePath,
        },
      });

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
