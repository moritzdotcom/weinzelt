import {
  createAndSendReservationInvoice,
  createReservationInvoice,
} from '@/lib/reservationInvoice';
import { getServerSession } from '@/lib/session';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: true } | { message: string }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const reservationId = req.query.id;
  const sendMail = req.body.send;

  if (typeof reservationId !== 'string') {
    return res.status(400).json({ message: 'Missing reservation id' });
  }
  const session = await getServerSession(req);
  if (!session) return res.status(401).json({ message: 'Unauthorized' });

  try {
    if (sendMail) {
      await createAndSendReservationInvoice(reservationId);
    } else {
      await createReservationInvoice(reservationId);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: 'Invoice Generation failed' });
  }
}
