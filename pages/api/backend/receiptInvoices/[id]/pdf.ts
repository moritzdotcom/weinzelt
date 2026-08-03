import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import { downloadReceiptInvoicePdf } from '@/lib/receiptInvoice/storage';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
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

  try {
    const pdf = await downloadReceiptInvoicePdf(document.finalPdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${document.documentNumber}.pdf"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Length', pdf.length);

    return res.status(200).send(pdf);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'PDF konnte nicht geladen werden.',
    });
  }
}
