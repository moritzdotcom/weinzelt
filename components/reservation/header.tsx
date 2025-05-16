import { Box, Typography } from '@mui/material';
import Link from 'next/link';

export default function ReservationHeader({ children }: { children: string }) {
  return (
    <Box className="text-center mb-6">
      <Link href="/">
        <img
          src="/logo.png"
          alt="Weinzelt Logo"
          className="mx-auto h-20 mb-12"
        />
      </Link>
      <Typography variant="h4" gutterBottom>
        {children}
      </Typography>
    </Box>
  );
}
