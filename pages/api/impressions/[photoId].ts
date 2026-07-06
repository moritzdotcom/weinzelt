import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const photoId = req.query.photoId as string;
    if (!photoId) {
      return res.status(400).json({ error: 'photoId ist erforderlich' });
    }

    const photo = await prisma.impressionPhoto.findUnique({
      where: { id: photoId },
    });
    if (!photo) {
      return res.status(404).json({ error: 'Foto nicht gefunden' });
    }

    // Foto ggf. als Cover entfernen
    await prisma.album.updateMany({
      where: { coverPhotoId: photoId },
      data: { coverPhotoId: null },
    });

    // zuerst in Supabase löschen
    const { error: storageError } = await supabase.storage
      .from('Weinzelt')
      .remove([photo.path]);

    if (storageError) {
      console.error(storageError);
      // optional: trotzdem löschen oder abbrechen – ich lösche trotzdem:
    }

    await prisma.impressionPhoto.delete({
      where: { id: photoId },
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: error.message ?? 'Fehler beim Löschen des Fotos' });
  }
}
