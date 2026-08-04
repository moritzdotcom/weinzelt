import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

import BackendHeader from '@/components/backend/header';
import BackendPermissionGuard from '@/components/backend/BackendPermissionGuard';
import { ReservationDetailsDialog } from '@/components/backend/reservationDetailDialog';

import { BACKEND_PERMISSIONS } from '@/lib/backend/permissions';

import type { Session } from '@/hooks/useSession';

import type {
  ApiReceiptInvoiceCorrectionsListResponse,
  ReceiptInvoiceCorrectionListItem,
} from '@/pages/api/backend/receiptInvoices/list';

const PAGE_SIZE = 25;

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

function formatMoney(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

function formatReceiptDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'UTC',
  }).format(date);
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  }).format(date);
}

export default function ReceiptInvoicesPage({ session }: { session: Session }) {
  const [corrections, setCorrections] = useState<
    ReceiptInvoiceCorrectionListItem[]
  >([]);

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [reservationDialogId, setReservationDialogId] = useState<string | null>(
    null,
  );

  const totalPages = useMemo(() => {
    return Math.max(Math.ceil(total / PAGE_SIZE), 1);
  }, [total]);

  async function loadCorrections() {
    try {
      setLoading(true);
      setError(null);

      const response =
        await axios.get<ApiReceiptInvoiceCorrectionsListResponse>(
          '/api/backend/receiptInvoices/list',
          {
            params: {
              q: q || undefined,
              from: from || undefined,
              to: to || undefined,
              page,
              pageSize: PAGE_SIZE,
            },
          },
        );

      setCorrections(response.data.corrections);

      setTotal(response.data.total);

      const responseTotalPages = Math.max(
        Math.ceil(response.data.total / response.data.pageSize),
        1,
      );

      if (page > responseTotalPages) {
        setPage(responseTotalPages);
      }
    } catch (error) {
      console.error(error);

      setError(
        getErrorMessage(
          error,
          'Rechnungskorrekturen konnten nicht geladen werden.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadCorrections();
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, from, to, page]);

  function handleSearchChange(value: string) {
    setPage(1);
    setQ(value);
  }

  function handleFromChange(value: string) {
    setPage(1);
    setFrom(value);
  }

  function handleToChange(value: string) {
    setPage(1);
    setTo(value);
  }

  return (
    <BackendPermissionGuard
      session={session}
      permission={BACKEND_PERMISSIONS.RECEIPT_INVOICES}
      deniedTitle="Kein Zugriff auf Rechnungskorrekturen"
      deniedDescription="Du hast keine Berechtigung, Rechnungskorrekturen im Backend anzusehen."
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <Stack spacing={4}>
          <BackendHeader
            title="Rechnungskorrekturen"
            subtitle="Erstellte Rechnungsergänzungen zu Kassenbelegen suchen, anzeigen und herunterladen."
            action={
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                href="/backend/receiptInvoices/new"
              >
                Neue Rechnungskorrektur
              </Button>
            }
          />

          {error && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={loadCorrections}>
                  Erneut versuchen
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 2.5 }}>
              <Stack
                direction={{
                  xs: 'column',
                  md: 'row',
                }}
                spacing={2}
                alignItems={{
                  xs: 'stretch',
                  md: 'center',
                }}
              >
                <TextField
                  value={q}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Dokument, Beleg, Firma, Name, E-Mail oder Tisch suchen"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Erstellt von"
                  type="date"
                  size="small"
                  value={from}
                  onChange={(event) => handleFromChange(event.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    minWidth: 180,
                  }}
                />

                <TextField
                  label="Erstellt bis"
                  type="date"
                  size="small"
                  value={to}
                  onChange={(event) => handleToChange(event.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    minWidth: 180,
                  }}
                />
              </Stack>
            </Box>

            <Divider />

            <Box
              sx={{
                px: 2.5,
                py: 1.5,
              }}
            >
              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row',
                }}
                justifyContent="space-between"
                alignItems={{
                  xs: 'flex-start',
                  sm: 'center',
                }}
                spacing={1}
              >
                <Typography variant="body2" color="text.secondary">
                  {loading
                    ? 'Rechnungskorrekturen werden geladen...'
                    : `${total} Rechnungskorrektur${
                        total === 1 ? '' : 'en'
                      } gefunden`}
                </Typography>

                {(q || from || to) && (
                  <Button
                    size="small"
                    onClick={() => {
                      setQ('');
                      setFrom('');
                      setTo('');
                      setPage(1);
                    }}
                  >
                    Filter zurücksetzen
                  </Button>
                )}
              </Stack>
            </Box>

            <Divider />

            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Dokument</TableCell>

                    <TableCell>Rechnungsempfänger</TableCell>

                    <TableCell>Kassenbeleg</TableCell>

                    <TableCell>Reservierung</TableCell>

                    <TableCell align="right">Betrag</TableCell>

                    <TableCell align="right">Aktionen</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    Array.from({
                      length: 6,
                    }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={6}>
                          <div className="h-12 w-full animate-pulse rounded-lg bg-gray-100" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : corrections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box
                          sx={{
                            py: 7,
                            px: 2,
                            textAlign: 'center',
                          }}
                        >
                          <ReceiptLongRoundedIcon
                            sx={{
                              fontSize: 42,
                              color: 'text.disabled',
                              mb: 1,
                            }}
                          />

                          <Typography fontWeight={700}>
                            Keine Rechnungskorrekturen gefunden
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 0.5,
                            }}
                          >
                            Passe die Suche oder den Zeitraum an.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    corrections.map((correction) => {
                      const tableNumber =
                        correction.tableNumber ||
                        correction.reservation.tableNumber;

                      return (
                        <TableRow key={correction.id} hover>
                          <TableCell>
                            <Typography fontWeight={800}>
                              {correction.documentNumber}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              Erstellt am{' '}
                              {formatCreatedAt(correction.createdAt)}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography fontWeight={700}>
                              {correction.recipientCompany}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              {correction.recipientEmail ||
                                'Keine E-Mail hinterlegt'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Stack spacing={0.5} alignItems="flex-start">
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`Beleg ${correction.receiptNumber}`}
                              />

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatReceiptDate(correction.receiptDate)}
                                {tableNumber ? ` · Tisch ${tableNumber}` : ''}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Typography fontWeight={700}>
                              {correction.reservation.name}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              {correction.reservation.email}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              {correction.reservation.people} Personen ·{' '}
                              {correction.reservation.type}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography fontWeight={800}>
                              {formatMoney(
                                correction.grossCents,
                                correction.currency,
                              )}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              bereits bezahlt
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={0.5}
                              justifyContent="flex-end"
                            >
                              <Tooltip title="PDF anzeigen">
                                <IconButton
                                  component="a"
                                  href={`/api/backend/receiptInvoices/${correction.id}/pdf`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <PictureAsPdfRoundedIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="PDF herunterladen">
                                <IconButton
                                  component="a"
                                  href={`/api/backend/receiptInvoices/${correction.id}/pdf?download=1`}
                                >
                                  <DownloadRoundedIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Reservierung anzeigen">
                                <IconButton
                                  onClick={() =>
                                    setReservationDialogId(
                                      correction.reservation.id,
                                    )
                                  }
                                >
                                  <VisibilityRoundedIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>

            {!loading && totalPages > 1 && (
              <>
                <Divider />

                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Pagination
                    page={page}
                    count={totalPages}
                    onChange={(_event, nextPage) => {
                      setPage(nextPage);
                    }}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              </>
            )}
          </Paper>
        </Stack>

        <ReservationDetailsDialog
          reservationId={reservationDialogId}
          open={Boolean(reservationDialogId)}
          onClose={() => setReservationDialogId(null)}
        />
      </div>
    </BackendPermissionGuard>
  );
}
