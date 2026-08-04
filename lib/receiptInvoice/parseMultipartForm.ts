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
    multiples: true,
    maxFiles: 20,
    maxFileSize: 12 * 1024 * 1024,
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

  return typeof value === 'string'
    ? // @ts-ignore
      value.trim() || null
    : null;
}

export function getUploadedFiles(files: Files, ...names: string[]): File[] {
  for (const name of names) {
    const value = files[name];

    if (!value) continue;

    return Array.isArray(value) ? value : [value];
  }

  return [];
}
