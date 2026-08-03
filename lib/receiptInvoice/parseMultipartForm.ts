import formidable, { type Fields, type File, type Files } from 'formidable';
import type { NextApiRequest } from 'next';

export type ParsedMultipartForm = {
  fields: Fields;
  files: Files;
};

export function parseMultipartForm(
  req: NextApiRequest,
): Promise<ParsedMultipartForm> {
  const form = formidable({
    multiples: false,
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        fields,
        files,
      });
    });
  });
}

export function getStringField(fields: Fields, name: string): string | null {
  const value = fields[name];

  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  // @ts-ignore
  return typeof value === 'string' ? value.trim() || null : null;
}

export function getBooleanField(fields: Fields, name: string): boolean {
  const value = getStringField(fields, name);

  return value === 'true' || value === '1';
}

export function getUploadedFile(files: Files, name: string): File | null {
  const value = files[name];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
