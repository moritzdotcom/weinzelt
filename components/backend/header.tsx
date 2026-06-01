import { ArrowBackRounded } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import { ReactNode } from 'react';

type BackendHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
};

export default function BackendHeader({
  title,
  subtitle,
  backHref = '/backend',
  backLabel = 'Weinzelt Backend',
  action,
}: BackendHeaderProps) {
  return (
    <Box className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <Box>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 transition hover:text-black"
        >
          <ArrowBackRounded fontSize="small" />
          {backLabel}
        </Link>

        <Typography
          variant="h4"
          className="mt-8"
          sx={{ fontSize: { xs: 24, sm: 32 } }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            sx={{ fontSize: { xs: 14, sm: 16 } }}
            className="mt-2 max-w-2xl text-gray-500"
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && <Box className="shrink-0 sm:pb-1">{action}</Box>}
    </Box>
  );
}
