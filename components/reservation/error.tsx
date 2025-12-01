import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import ReservationReminderForm from './reminderForm';

export default function ReservationError({ text }: { text: string }) {
  return (
    <Box className="flex flex-col gap-5 text-center justify-center items-center h-screen">
      <img src="/logo.png" alt="Weinzelt Logo" className="mx-auto h-20" />
      <Typography variant="h6" gutterBottom>
        {text}
      </Typography>

      <ReservationReminderForm />
      <Link href="/" className="underline text-lg">
        Zurück zur Startseite
      </Link>
    </Box>
  );
}
