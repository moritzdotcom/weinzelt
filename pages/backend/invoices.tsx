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
  MenuItem,
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
import SearchIcon from '@mui/icons-material/Search';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

import type {
  ApiBackendInvoicesGetResponse,
  BackendInvoiceListItem,
} from '@/pages/api/backend/invoices';
import { CreateInvoiceDialog } from '@/components/backend/createInvoiceDialog';
import { centsToEUR, formatDate } from '@/lib/helpers';
import { ReservationDetailsDialog } from '@/components/backend/reservationDetailDialog';
import { translateState } from '@/lib/reservation';
import BackendHeader from '@/components/backend/header';

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<BackendInvoiceListItem[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [reservationDialogId, setReservationDialogId] = useState<string | null>(
    null,
  );

  async function loadInvoices() {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get<ApiBackendInvoicesGetResponse>(
        '/api/backend/invoices',
        {
          params: {
            q: q || undefined,
            status,
            from: from || undefined,
            to: to || undefined,
            page: 1,
            pageSize: 50,
          },
        },
      );

      setInvoices(res.data.invoices);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      setError('Rechnungen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const to = setTimeout(() => loadInvoices(), 500);
    return () => {
      clearInterval(to);
    };
  }, [q, status, from, to]);

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (from) params.set('from', from);
    if (to) params.set('to', to);

    return `/api/backend/invoices/export.zip?${params.toString()}`;
  }, [from, to]);

  async function markReservationPaid(invoice: BackendInvoiceListItem) {
    try {
      setActionLoadingId(invoice.id);

      await axios.post(
        `/api/reservations/${invoice.reservation.id}/trackManualPayment`,
      );

      await loadInvoices();
    } catch (err) {
      console.error(err);
      setError('Reservierung konnte nicht als bezahlt markiert werden.');
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <Stack spacing={4}>
        <BackendHeader
          title="Rechnungen"
          subtitle="Rechnungen erstellen, versenden, suchen und als ZIP exportieren."
          action={
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<DownloadRoundedIcon />}
                href={exportUrl}
              >
                Zeitraum als ZIP
              </Button>

              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Rechnung erstellen
              </Button>
            </Stack>
          }
        />

        {error && <Alert severity="error">{error}</Alert>}

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
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <TextField
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechnung, Name, E-Mail oder Tischnummer suchen"
                size="small"
                fullWidth
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
                label="Status"
                size="small"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="unsent">Nicht versendet</MenuItem>
                <MenuItem value="sent">Versendet</MenuItem>
                <MenuItem value="unpaid">Zahlung offen</MenuItem>
                <MenuItem value="paid">Bezahlt</MenuItem>
              </TextField>

              <TextField
                label="Von"
                type="date"
                size="small"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                sx={{ minWidth: 180 }}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Bis"
                type="date"
                size="small"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                sx={{ minWidth: 180 }}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ px: 2.5, py: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {loading
                ? 'Rechnungen werden geladen...'
                : `${total} Rechnung${total === 1 ? '' : 'en'} gefunden`}
            </Typography>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rechnung</TableCell>
                  <TableCell>Kunde</TableCell>
                  <TableCell>Reservierung</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Summe</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6}>
                        <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography fontWeight={600}>
                          Keine Rechnungen gefunden
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                          Passe die Suche oder den Zeitraum an.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => {
                    const isPaid = invoice.reservation.paymentStatus === 'PAID';

                    return (
                      <TableRow key={invoice.id} hover>
                        <TableCell>
                          <Typography fontWeight={700}>
                            {invoice.invoiceNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Erstellt am {formatDate(invoice.issuedAt)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {invoice.sentAt
                              ? `Versendet am ${formatDate(invoice.sentAt)}`
                              : 'Noch nicht versendet'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography fontWeight={600}>
                            {invoice.customerName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {invoice.customerEmail}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography fontWeight={600}>
                            {invoice.reservation.people} Personen
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {invoice.reservation.type}
                            {invoice.reservation.tableNumber
                              ? ` · Tisch ${invoice.reservation.tableNumber}`
                              : ''}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={1} alignItems="flex-start">
                            <Chip
                              size="small"
                              label={translateState(
                                invoice.reservation.paymentStatus,
                              )}
                              color={paymentStatusColor(
                                invoice.reservation.paymentStatus,
                              )}
                              variant="outlined"
                            />

                            <Chip
                              size="small"
                              label={
                                invoice.sentAt
                                  ? 'Rechnung versendet'
                                  : 'Nicht versendet'
                              }
                              variant="outlined"
                            />
                          </Stack>
                        </TableCell>

                        <TableCell align="right">
                          <Typography fontWeight={700}>
                            {centsToEUR(invoice.totalCents)}
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
                                href={`/api/reservations/${invoice.reservation.id}/invoice`}
                                target="_blank"
                              >
                                <PictureAsPdfRoundedIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Reservierung anzeigen">
                              <IconButton
                                onClick={() =>
                                  setReservationDialogId(invoice.reservation.id)
                                }
                              >
                                <VisibilityRoundedIcon />
                              </IconButton>
                            </Tooltip>

                            {!isPaid && (
                              <Tooltip title="Als bezahlt markieren">
                                <span>
                                  <IconButton
                                    disabled={actionLoadingId === invoice.id}
                                    onClick={() => markReservationPaid(invoice)}
                                  >
                                    <PaidRoundedIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}

                            <Tooltip title="Rechnung erneut versenden">
                              <IconButton
                                onClick={() => {
                                  // Optional: endpoint ergänzen
                                  // POST /api/reservations/:id/invoice/send
                                }}
                              >
                                <SendRoundedIcon />
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
        </Paper>
      </Stack>

      <CreateInvoiceDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={async () => {
          setCreateDialogOpen(false);
          await loadInvoices();
        }}
      />
      <ReservationDetailsDialog
        reservationId={reservationDialogId}
        open={Boolean(reservationDialogId)}
        onClose={() => setReservationDialogId(null)}
      />
    </div>
  );
}
