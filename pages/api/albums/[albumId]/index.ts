import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const albumId = req.query.albumId as string;
    if (!albumId) {
      return res.status(400).json({ error: 'albumId ist erforderlich' });
    }

    const album = await prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      return res.status(404).json({ error: 'Album nicht gefunden' });
    }

    const photos = await prisma.impressionPhoto.findMany({
      where: { albumId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const result = photos.map((photo) => {
      const {
        data: { publicUrl },
      } = supabase.storage.from('Weinzelt').getPublicUrl(photo.path);

      return {
        ...photo,
        url: publicUrl,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message ?? 'Fehler beim Laden der Fotos' });
  }
}
