import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { downloadReceiptInvoicePdf } from '@/lib/receiptInvoice/storage';

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_').replace(/_+/g, '_');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

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

  const id = req.query.id;

  if (typeof id !== 'string') {
    return res.status(400).json({
      message: 'Missing document id',
    });
  }

  const download = req.query.download === '1' || req.query.download === 'true';

  try {
    const document = await prisma.receiptInvoiceSupplement.findUnique({
      where: {
        id,
      },
      select: {
        documentNumber: true,
        finalPdfPath: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        message: 'Dokument nicht gefunden.',
      });
    }

    const pdf = await downloadReceiptInvoicePdf(document.finalPdfPath);

    const filename = `${sanitizeFilename(document.documentNumber)}.pdf`;

    const disposition = download ? 'attachment' : 'inline';

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(
        filename,
      )}`,
    );

    res.setHeader('Cache-Control', 'private, no-store');

    res.setHeader('Content-Length', String(pdf.length));

    return res.status(200).send(pdf);
  } catch (error) {
    console.error('Receipt invoice PDF could not be loaded:', error);

    return res.status(500).json({
      message: 'PDF konnte nicht geladen werden.',
    });
  }
}
