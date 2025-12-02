import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const albumId = req.query.albumId as string;
    const { photoId } = req.body as { photoId?: string };

    if (!albumId || !photoId) {
      return res
        .status(400)
        .json({ error: 'albumId und photoId sind erforderlich' });
    }

    // prüfen, ob Foto zum Album gehört
    const photo = await prisma.impressionPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.albumId !== albumId) {
      return res
        .status(400)
        .json({ error: 'Foto gehört nicht zu diesem Album' });
    }

    const updated = await prisma.album.update({
      where: { id: albumId },
      data: { coverPhotoId: photoId },
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message ?? 'Fehler beim Setzen des Covers' });
  }
}
