import formidable, { File, Fields } from 'formidable';
import path from 'node:path';
import type { NextApiRequest } from 'next';

export function firstField(fields: Fields, key: string) {
  const value = fields[key];

  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseBoolean(value: string): boolean {
  return value === 'true';
}

export function getFirstFile(file: File | File[] | undefined) {
  if (!file) return null;
  return Array.isArray(file) ? (file[0] ?? null) : file;
}

export function getSafeImageExtension(file: File) {
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

export function getSafeAttachmentExtension(file: File) {
  const extension = path
    .extname(file.originalFilename ?? '')
    .replace('.', '')
    .toLowerCase();

  if (['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
    return extension === 'jpeg' ? 'jpg' : extension;
  }

  switch (file.mimetype) {
    case 'application/pdf':
      return 'pdf';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
      return 'jpg';
    default:
      return 'pdf';
  }
}

export function isAllowedAttachment(file: File) {
  return ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(
    file.mimetype || '',
  );
}

export async function parseSpecialEventForm(req: NextApiRequest) {
  const form = formidable({
    multiples: false,
    maxFiles: 2,
    maxFileSize: 12 * 1024 * 1024,
    filter: ({ name, mimetype }) => {
      if (name === 'titleImage') {
        return Boolean(mimetype?.startsWith('image/'));
      }

      if (name === 'attachment') {
        return [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
        ].includes(mimetype || '');
      }

      return false;
    },
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
