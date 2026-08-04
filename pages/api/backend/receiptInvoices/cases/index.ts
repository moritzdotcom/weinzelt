import fs from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerSession } from '@/lib/session';
import { parseTebiReceiptPdf } from '@/lib/receiptInvoice/parseTebiReceipt';
import {
  getStringField,
  getUploadedFiles,
  parseMultipartForm,
} from '@/lib/receiptInvoice/parseMultipartForm';
import {
  createReceiptInvoiceCase,
  type ReceiptFileInput,
} from '@/lib/receiptInvoice/createCase';
import type {
  CreateReceiptInvoiceCaseResponse,
  CreateReceiptInvoiceConfiguration,
  ReceiptInvoiceMode,
} from '@/lib/receiptInvoice/types';

export const config = {
  api: {
    bodyParser: false,
  },
};

function isReceiptInvoiceMode(
  value: string | null,
): value is ReceiptInvoiceMode {
  return value === 'SINGLE' || value === 'COLLECTION' || value === 'SPLIT';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | CreateReceiptInvoiceCaseResponse
    | {
        message: string;
      }
  >,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

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

  const temporaryPaths: string[] = [];

  try {
    const { fields, files } = await parseMultipartForm(req);

    const mode = getStringField(fields, 'mode');

    const reservationId = getStringField(fields, 'reservationId');

    const configurationJson = getStringField(fields, 'configuration');

    if (!isReceiptInvoiceMode(mode)) {
      return res.status(400).json({
        message: 'Ungültige Vorgangsart.',
      });
    }

    if (!configurationJson) {
      return res.status(400).json({
        message: 'Die Konfiguration fehlt.',
      });
    }

    let configuration: CreateReceiptInvoiceConfiguration;

    try {
      configuration = JSON.parse(
        configurationJson,
      ) as CreateReceiptInvoiceConfiguration;
    } catch {
      return res.status(400).json({
        message: 'Die Konfiguration ist ungültig.',
      });
    }

    const uploadedFiles = getUploadedFiles(files, 'files', 'file');

    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        message: 'Bitte lade mindestens einen Kassenbeleg hoch.',
      });
    }

    const sources: ReceiptFileInput[] = [];

    for (const file of uploadedFiles) {
      temporaryPaths.push(file.filepath);

      const isPdf =
        file.mimetype === 'application/pdf' ||
        file.originalFilename?.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        throw new Error('Es sind ausschließlich PDF-Dateien erlaubt.');
      }

      const pdf = await fs.readFile(file.filepath);

      const receipt = await parseTebiReceiptPdf(pdf);

      sources.push({
        filename: file.originalFilename || 'kassenbeleg.pdf',
        pdf,
        receipt,
      });
    }

    const result = await createReceiptInvoiceCase({
      mode,
      reservationId,
      configuration,
      sources,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : 'Der Rechnungsvorgang konnte nicht erstellt werden.',
    });
  } finally {
    await Promise.all(
      temporaryPaths.map((temporaryPath) =>
        fs.unlink(temporaryPath).catch(() => undefined),
      ),
    );
  }
}
