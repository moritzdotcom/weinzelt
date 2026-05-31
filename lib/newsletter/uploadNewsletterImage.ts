import { readFile } from 'fs/promises';
import type { File } from 'formidable';
import { supabase } from '@/lib/supabase';
import path from 'node:path';

const BUCKET_NAME = 'Weinzelt';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

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

export async function uploadNewsletterImage(params: {
  newsletterId: string;
  image: File;
}) {
  const { newsletterId, image } = params;

  if (!image.mimetype || !ALLOWED_IMAGE_TYPES.includes(image.mimetype)) {
    throw new Error('Das Titelbild muss eine JPG-, PNG- oder WebP-Datei sein.');
  }

  if (image.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Das Titelbild darf maximal 8 MB groß sein.');
  }

  const extension = getSafeImageExtension(image);
  const imagePath = `newsletters/${newsletterId}/titleImage.${extension}`;
  const fileBuffer = await readFile(image.filepath);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(imagePath, fileBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: image.mimetype,
    });

  if (uploadError) {
    throw new Error(
      `Das Titelbild konnte nicht hochgeladen werden: ${uploadError.message}`,
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imagePath);

  return {
    imagePath,
    imageUrl: publicUrl,
  };
}

export async function deleteNewsletterImage(imagePath: string) {
  await supabase.storage.from(BUCKET_NAME).remove([imagePath]);
}
