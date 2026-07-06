// /pages/api/albums/[albumId]/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';
import { BACKEND_PERMISSIONS } from '@/lib/backend/permissions';
import { requireBackendPermission } from '@/lib/backend/permissionGuard';

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const authUser = await requireBackendPermission(
    req,
    res,
    BACKEND_PERMISSIONS.IMPRESSIONS,
  );

  if (!authUser) return;

  const albumId = req.query.albumId;

  if (typeof albumId !== 'string') {
    return res.status(400).json({ error: 'albumId ist erforderlich' });
  }

  if (req.method === 'GET') {
    return handleGET(req, res, albumId);
  }

  if (req.method === 'DELETE') {
    return handleDELETE(req, res, albumId);
  }

  res.setHeader('Allow', ['GET', 'DELETE']);

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGET(
  req: NextApiRequest,
  res: NextApiResponse,
  albumId: string,
) {
  try {
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
  } catch (error) {
    console.error('[album:get]', error);

    return res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Fehler beim Laden der Fotos',
    });
  }
}

async function handleDELETE(
  req: NextApiRequest,
  res: NextApiResponse,
  albumId: string,
) {
  try {
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: {
        id: true,
        year: true,
        day: true,
      },
    });

    if (!album) {
      return res.status(404).json({ error: 'Album nicht gefunden' });
    }

    const photos = await prisma.impressionPhoto.findMany({
      where: { albumId },
      select: {
        id: true,
        path: true,
      },
    });

    const storagePaths = Array.from(
      new Set(
        photos
          .map((photo) => photo.path)
          .filter((path): path is string => !!path),
      ),
    );

    /**
     * Erst Storage löschen, dann DB löschen.
     * Vorteil: Wenn Supabase fehlschlägt, bleibt das Album in der DB bestehen
     * und man kann den Löschvorgang erneut ausführen.
     */
    for (const chunk of chunkArray(storagePaths, 100)) {
      const { error } = await supabase.storage.from('Weinzelt').remove(chunk);

      if (error) {
        console.error('[album:delete] supabase remove failed:', error);

        return res.status(500).json({
          error:
            'Album konnte nicht gelöscht werden, weil Dateien im Storage nicht entfernt werden konnten.',
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      /**
       * Falls dein Album model kein coverPhotoId Feld hat,
       * diese Zeile entfernen.
       */
      await tx.album.update({
        where: { id: albumId },
        data: {
          coverPhotoId: null,
        },
      });

      await tx.impressionPhoto.deleteMany({
        where: { albumId },
      });

      await tx.album.delete({
        where: { id: albumId },
      });
    });

    return res.status(200).json({
      success: true,
      deletedAlbumId: album.id,
      deletedPhotos: photos.length,
      deletedFiles: storagePaths.length,
    });
  } catch (error) {
    console.error('[album:delete]', error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Fehler beim Löschen des Albums',
    });
  }
}
