// /components/backend/BackendPageLoading.tsx

import { Box, Grid, Skeleton } from '@mui/material';

export default function BackendPageLoading() {
  return (
    <Box className="max-w-5xl mx-auto px-4 py-16">
      <div className="mb-8">
        <Skeleton variant="text" width={240} height={42} />
        <Skeleton variant="text" width={380} height={24} />
      </div>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Skeleton variant="rounded" height={164} sx={{ borderRadius: 4 }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Skeleton variant="rounded" height={164} sx={{ borderRadius: 4 }} />
        </Grid>
      </Grid>
    </Box>
  );
}
