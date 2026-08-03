import fs from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerSession } from '@/lib/session';
import { parseTebiReceiptPdf } from '@/lib/receiptInvoice/parseTebiReceipt';
import {
  getUploadedFile,
  parseMultipartForm,
} from '@/lib/receiptInvoice/parseMultipartForm';
import type { ParsedTebiReceipt } from '@/lib/receiptInvoice/types';

export const config = {
  api: {
    bodyParser: false,
  },
};

export type ParseReceiptResponse = {
  receipt: ParsedTebiReceipt;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ParseReceiptResponse | { message: string }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const session = await getServerSession(req);

  if (!session) {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  let temporaryPath: string | null = null;

  try {
    const { files } = await parseMultipartForm(req);
    const file = getUploadedFile(files, 'file');

    if (!file) {
      return res.status(400).json({
        message: 'Bitte lade einen Kassenbeleg hoch.',
      });
    }

    temporaryPath = file.filepath;

    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalFilename?.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return res.status(400).json({
        message: 'Es sind ausschließlich PDF-Dateien erlaubt.',
      });
    }

    const buffer = await fs.readFile(file.filepath);
    const receipt = await parseTebiReceiptPdf(buffer);

    return res.status(200).json({
      receipt,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : 'Der Kassenbeleg konnte nicht gelesen werden.',
    });
  } finally {
    if (temporaryPath) {
      await fs.unlink(temporaryPath).catch(() => undefined);
    }
  }
}
