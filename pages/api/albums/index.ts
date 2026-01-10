import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET /api/albums
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const albums = await prisma.album.findMany({
      orderBy: [{ year: 'desc' }, { day: 'asc' }],
      include: {
        coverPhoto: true,
        _count: { select: { photos: true } },
      },
    });

    const result = albums.map((album) => {
      let coverUrl: string | null = null;
      if (album.coverPhoto) {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from('Weinzelt')
          .getPublicUrl(album.coverPhoto.path);
        coverUrl = publicUrl;
      }

      const normalizedDay = album.day
        .replaceAll('ae', 'ä')
        .replaceAll('oe', 'ö')
        .replaceAll('ue', 'ü')
        .replaceAll('ss', 'ß');

      return {
        id: album.id,
        year: album.year,
        day: normalizedDay,
        photoCount: album._count.photos,
        coverUrl,
        coverPhotoId: album.coverPhotoId,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message ?? 'Fehler beim Laden der Alben' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req);
    if (!session) return res.status(401).json('Not authenticated');
    const { year, day } = req.body as { year?: number; day?: string };

    if (!year || !day) {
      return res.status(400).json({ error: 'year und day sind erforderlich' });
    }

    const normalizedDay = day
      .replaceAll('ä', 'ae')
      .replaceAll('ö', 'oe')
      .replaceAll('ü', 'ue')
      .replaceAll('ß', 'ss');

    const album = await prisma.album.create({
      data: {
        year,
        day: normalizedDay,
      },
    });

    return res.status(200).json(album);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      // unique
      return res
        .status(400)
        .json({ error: 'Für dieses Jahr/Tag existiert bereits ein Album.' });
    }
    return res
      .status(500)
      .json({ error: error.message ?? 'Fehler beim Erstellen des Albums' });
  }
}
