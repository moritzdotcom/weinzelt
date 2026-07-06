import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { parseForm } from '@/lib/parseForm';
import { getServerSession } from '@/lib/session';
import { imageSize } from 'image-size';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

function getSafeImageExtension({
  originalFilename,
  mimetype,
}: {
  originalFilename?: string | null;
  mimetype?: string | null;
}) {
  if (mimetype === 'image/jpeg') return 'jpg';
  if (mimetype === 'image/png') return 'png';
  if (mimetype === 'image/webp') return 'webp';

  const rawExt = originalFilename?.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanExt = rawExt.replace(/[^a-z0-9]/g, '');

  if (ALLOWED_IMAGE_EXTENSIONS.has(cleanExt)) {
    return cleanExt === 'jpeg' ? 'jpg' : cleanExt;
  }

  return 'jpg';
}

function getSafeContentType(ext: string, fallback?: string | null) {
  if (ext === 'jpg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';

  return fallback || 'image/jpeg';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);

  if (!session) {
    return res.status(401).json('Not authenticated');
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fields, files } = await parseForm(req);

    const albumId = (fields.albumId?.[0] || fields.albumId) as
      | string
      | undefined;

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!albumId) {
      return res.status(400).json({ error: 'albumId ist erforderlich' });
    }

    if (!file) {
      return res.status(400).json({ error: 'file ist erforderlich' });
    }

    if (!file.mimetype?.startsWith('image/')) {
      return res.status(400).json({
        error: 'Nur Bilddateien sind erlaubt.',
      });
    }

    const album = await prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      return res.status(400).json({ error: 'Album nicht gefunden' });
    }

    const ext = getSafeImageExtension({
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
    });

    const fileName = `${randomUUID()}.${ext}`;

    /**
     * Wichtig:
     * Kein album.day im Pfad verwenden.
     * Der Albumname darf Umlaute enthalten, aber der Storage-Pfad bleibt technisch sauber.
     */
    const storagePath = `impressions/${album.year}/${album.id}/${fileName}`;

    const fileBuffer = await fs.promises.readFile(file.filepath);

    const dimensions = imageSize(fileBuffer);
    const width = dimensions.width ?? null;
    const height = dimensions.height ?? null;

    const contentType = getSafeContentType(ext, file.mimetype);

    const { error: uploadError } = await supabase.storage
      .from('Weinzelt')
      .upload(storagePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (uploadError) {
      console.error('[impressions:upload] Supabase error:', uploadError);

      return res.status(500).json({
        error: 'Upload zu Supabase fehlgeschlagen',
      });
    }

    const photo = await prisma.impressionPhoto.create({
      data: {
        albumId: album.id,
        path: storagePath,
        sortOrder: 0,
        width,
        height,
      },
    });

    const {
      data: { publicUrl },
    } = supabase.storage.from('Weinzelt').getPublicUrl(storagePath);

    return res.status(200).json({
      ...photo,
      url: publicUrl,
      year: album.year,
      day: album.day,
    });
  } catch (error) {
    console.error('[impressions:upload]', error);

    return res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Serverfehler beim Upload',
    });
  }
}
