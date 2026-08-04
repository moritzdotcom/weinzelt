import fs from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerSession } from '@/lib/session';
import { parseTebiReceiptPdf } from '@/lib/receiptInvoice/parseTebiReceipt';
import {
  getStringField,
  getUploadedFiles,
  parseMultipartForm,
} from '@/lib/receiptInvoice/parseMultipartForm';
import { createReceiptInvoiceCase } from '@/lib/receiptInvoice/createCase';
import {
  isCompleteBillingAddress,
  type BillingAddressInput,
} from '@/lib/receiptInvoice/types';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Kompatibilitätsantwort für bestehenden Frontend-Code.
export type CreateReceiptInvoiceResponse = {
  id: string;
  documentNumber: string;
  pdfUrl: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | CreateReceiptInvoiceResponse
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

    const reservationId = getStringField(fields, 'reservationId');

    const billingAddressJson = getStringField(fields, 'billingAddress');

    const saveBillingAddressRaw = getStringField(fields, 'saveBillingAddress');

    const uploadedFiles = getUploadedFiles(files, 'file', 'files');

    const file = uploadedFiles[0];

    if (!file) {
      return res.status(400).json({
        message: 'Bitte lade einen Kassenbeleg hoch.',
      });
    }

    temporaryPaths.push(file.filepath);

    if (!billingAddressJson) {
      return res.status(400).json({
        message: 'Bitte gib eine Rechnungsadresse an.',
      });
    }

    let billingAddress: BillingAddressInput;

    try {
      billingAddress = JSON.parse(billingAddressJson) as BillingAddressInput;
    } catch {
      return res.status(400).json({
        message: 'Die Rechnungsadresse ist ungültig.',
      });
    }

    if (!isCompleteBillingAddress(billingAddress)) {
      return res.status(400).json({
        message: 'Die Rechnungsadresse ist unvollständig.',
      });
    }

    const pdf = await fs.readFile(file.filepath);

    const receipt = await parseTebiReceiptPdf(pdf);

    const result = await createReceiptInvoiceCase({
      mode: 'SINGLE',
      reservationId,
      configuration: {
        mode: 'SINGLE',
        assignmentType: reservationId ? 'RESERVATION' : 'MANUAL',
        recipient: {
          billingAddress,
        },
        saveBillingAddress:
          saveBillingAddressRaw === 'true' || saveBillingAddressRaw === '1',
      },
      sources: [
        {
          filename: file.originalFilename || 'kassenbeleg.pdf',
          pdf,
          receipt,
        },
      ],
    });

    const document = result.documents[0];

    return res.status(201).json({
      id: document.id,
      documentNumber: document.documentNumber,
      pdfUrl: document.pdfUrl,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : 'Die Rechnung konnte nicht erstellt werden.',
    });
  } finally {
    await Promise.all(
      temporaryPaths.map((temporaryPath) =>
        fs.unlink(temporaryPath).catch(() => undefined),
      ),
    );
  }
}
