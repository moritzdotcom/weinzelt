import { Typography } from '@mui/material';
import Link from 'next/link';

export default function ARGBConfirmation() {
  return (
    <Typography
      variant="body2"
      className="text-sm text-gray-600 text-center py-3"
    >
      Mit dem Absenden akzeptierst du die{' '}
      <Link
        href="/argb"
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-black hover:text-gray-800"
      >
        Allgemeinen Reservierungs- und Geschäftsbedingungen
      </Link>
      .
    </Typography>
  );
}
