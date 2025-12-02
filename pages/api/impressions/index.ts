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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'POST') return handlePost(req, res);

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

    const album = await prisma.album.findUnique({
      where: { id: albumId },
    });
    if (!album) {
      return res.status(400).json({ error: 'Album nicht gefunden' });
    }

    const ext =
      (file.originalFilename || 'image.jpg').split('.').pop() || 'jpg';
    const fileName = `${randomUUID()}.${ext}`;
    // Pfad nutzt jetzt Jahr+Day des Albums
    const path = `${album.year}/${album.day}/${fileName}`;

    const fileBuffer = await fs.promises.readFile(file.filepath);

    const dimensions = imageSize(fileBuffer);
    const width = dimensions.width ?? null;
    const height = dimensions.height ?? null;

    const { error: uploadError } = await supabase.storage
      .from('Weinzelt')
      .upload(path, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype || 'image/jpeg',
      });

    if (uploadError) {
      console.error(uploadError);
      return res
        .status(500)
        .json({ error: 'Upload zu Supabase fehlgeschlagen' });
    }

    const photo = await prisma.impressionPhoto.create({
      data: {
        albumId: album.id,
        path,
        sortOrder: 0,
        width,
        height,
      },
    });

    const {
      data: { publicUrl },
    } = supabase.storage.from('Weinzelt').getPublicUrl(path);

    return res.status(200).json({
      ...photo,
      url: publicUrl,
      year: album.year,
      day: album.day,
    });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message ?? 'Serverfehler beim Upload' });
  }
}
