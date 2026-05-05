import * as React from 'react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

import type {
  ApiInvoiceReservationSearchResponse,
  InvoiceReservationSearchItem,
} from '@/pages/api/backend/reservations/search';
import { translateState } from '@/lib/reservation';

function paymentStatusColor(status: string) {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'CANCELED':
    case 'REFUNDED':
      return 'default';
    default:
      return 'warning';
  }
}

export function CreateInvoiceDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('without');
  const [reservations, setReservations] = useState<
    InvoiceReservationSearchItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function searchReservations() {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get<ApiInvoiceReservationSearchResponse>(
        '/api/backend/reservations/search',
        {
          params: {
            q: q || undefined,
            invoiceStatus,
          },
        },
      );

      setReservations(res.data.reservations);
    } catch (err) {
      console.error(err);
      setError('Reservierungen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    searchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoiceStatus]);

  async function createAndView(reservationId: string) {
    try {
      setActionLoadingId(reservationId);

      window.open(`/api/reservations/${reservationId}/invoice`, '_blank');

      await onCreated();
    } catch (err) {
      console.error(err);
      setError('Rechnung konnte nicht erstellt werden.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function createAndSend(reservationId: string) {
    try {
      setActionLoadingId(reservationId);

      await axios.post(
        `/api/backend/invoices/reservations/${reservationId}/create`,
        { send: true },
      );

      await onCreated();
    } catch (err) {
      console.error(err);
      setError('Rechnung konnte nicht erstellt und versendet werden.');
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Rechnung erstellen</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchReservations();
              }}
              label="Reservierung suchen"
              placeholder="Name, E-Mail, Tischnummer..."
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              label="Rechnungsstatus"
              value={invoiceStatus}
              onChange={(e) => setInvoiceStatus(e.target.value)}
              size="small"
              sx={{ minWidth: 210 }}
            >
              <MenuItem value="without">Ohne Rechnung</MenuItem>
              <MenuItem value="with">Mit Rechnung</MenuItem>
              <MenuItem value="all">Alle</MenuItem>
            </TextField>

            <Button variant="outlined" onClick={searchReservations}>
              Suchen
            </Button>
          </Stack>

          <Stack spacing={1.5}>
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 w-full animate-pulse rounded-2xl bg-gray-100"
                />
              ))
            ) : reservations.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography fontWeight={700}>
                  Keine Reservierungen gefunden
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Suche nach Name, E-Mail oder Tischnummer.
                </Typography>
              </Box>
            ) : (
              reservations.map((reservation) => {
                const hasInvoice = Boolean(reservation.invoice);
                const isActionLoading = actionLoadingId === reservation.id;

                return (
                  <Paper
                    key={reservation.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          <Typography fontWeight={800}>
                            {reservation.name}
                          </Typography>

                          <Chip
                            size="small"
                            label={
                              hasInvoice
                                ? `Rechnung ${reservation.invoice?.invoiceNumber}`
                                : 'Keine Rechnung'
                            }
                            color={hasInvoice ? 'success' : 'warning'}
                            variant="outlined"
                          />

                          <Chip
                            size="small"
                            label={translateState(reservation.paymentStatus)}
                            color={paymentStatusColor(
                              reservation.paymentStatus,
                            )}
                            variant="outlined"
                          />
                        </Stack>

                        <Typography variant="body2" color="text.secondary">
                          {reservation.email}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          {reservation.people} Personen · {reservation.type}
                          {reservation.tableNumber
                            ? ` · Tisch ${reservation.tableNumber}`
                            : ''}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Mindestverzehr:{' '}
                          {new Intl.NumberFormat('de-DE', {
                            style: 'currency',
                            currency: 'EUR',
                            maximumFractionDigits: 0,
                          }).format(reservation.minimumSpend)}
                        </Typography>
                      </Box>

                      <Stack spacing={1} alignItems={{ xs: 'stretch' }}>
                        {hasInvoice ? (
                          <Button
                            variant="outlined"
                            startIcon={<PictureAsPdfRoundedIcon />}
                            href={`/api/reservations/${reservation.id}/invoice`}
                            target="_blank"
                          >
                            Anzeigen
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outlined"
                              disabled={
                                reservation.paymentStatus !== 'PAID' ||
                                isActionLoading
                              }
                              startIcon={<PictureAsPdfRoundedIcon />}
                              onClick={() => createAndView(reservation.id)}
                            >
                              Erstellen & anzeigen
                            </Button>

                            <Button
                              variant="contained"
                              disabled={
                                reservation.paymentStatus !== 'PAID' ||
                                isActionLoading
                              }
                              startIcon={<SendRoundedIcon />}
                              onClick={() => createAndSend(reservation.id)}
                            >
                              Erstellen & versenden
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
}
