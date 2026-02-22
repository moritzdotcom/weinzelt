import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    return handleGET(req, res);
  }

  return res
    .status(405)
    .json({ error: `The HTTP ${req.method} method is not supported.` });
}

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const [
    reservations,
    companyReservations,
    eventRegistrations,
    reservationReminders,
    newsletterSubscriptions,
  ] = await Promise.all([
    prisma.reservation.findMany({
      select: { name: true, email: true },
    }),
    prisma.companyReservation.findMany({
      select: { name: true, email: true },
    }),
    prisma.eventRegistration.findMany({
      select: { name: true, email: true },
    }),
    prisma.reservationReminder.findMany({
      select: { name: true, email: true },
    }),
    prisma.newsletterSubscription.findMany({
      select: { name: true, email: true },
    }),
  ]);

  // 🔹 Mit ContactType anreichern
  const allEntries = [
    ...reservations.map((r) => ({ ...r, contactType: 'Reservation' })),
    ...companyReservations.map((r) => ({
      ...r,
      contactType: 'CompanyReservation',
    })),
    ...eventRegistrations.map((r) => ({
      ...r,
      contactType: 'EventRegistration',
    })),
    ...reservationReminders.map((r) => ({
      ...r,
      contactType: 'ReservationReminder',
    })),
    ...newsletterSubscriptions.map((r) => ({
      ...r,
      contactType: 'NewsletterSubscription',
    })),
  ];

  // 🔹 Dedup nach Email
  const uniqueByEmail = Array.from(
    new Map(
      allEntries
        .filter((e) => e.email)
        .map((entry) => [entry.email.toLowerCase(), entry]),
    ).values(),
  );

  // 🔹 CSV Header
  const header = ['Name', 'Email', 'ContactType'];

  const rows = uniqueByEmail.map((entry) => [
    sanitizeCSV(entry.name),
    sanitizeCSV(entry.email),
    sanitizeCSV(entry.contactType),
  ]);

  const csvContent = [header, ...rows].map((row) => row.join(';')).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');

  return res.status(200).send('\uFEFF' + csvContent);
}

function sanitizeCSV(value: string | null | undefined) {
  if (!value) return '';
  return `"${value.replace(/"/g, '""')}"`;
}
