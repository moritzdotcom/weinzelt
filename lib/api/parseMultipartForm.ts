import formidable, { type Fields, type Files, type File } from 'formidable';
import type { NextApiRequest } from 'next';

export function parseMultipartForm(req: NextApiRequest): Promise<{
  fields: Fields;
  files: Files;
}> {
  const form = formidable({
    multiples: false,
    maxFiles: 1,
    maxFileSize: 8 * 1024 * 1024,
    allowEmptyFiles: false,
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

export function firstField(fields: Fields, key: string): string {
  const value = fields[key];

  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return value || '';
}

export function firstFile(files: Files, key: string): File | undefined {
  const value = files[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
