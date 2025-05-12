import { Box, CircularProgress } from '@mui/material';

export default function ReservationLoading() {
  return (
    <Box className="flex justify-center items-center h-screen">
      <CircularProgress />
    </Box>
  );
}
