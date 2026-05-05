import { centsToEUR, formatDate, formatEUR } from '@/lib/helpers';
import { translateState } from '@/lib/reservation';
import { ApiGetReservationBackendResponse } from '@/pages/api/backend/reservations/[id]';
import { PictureAsPdfRounded } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';

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

export function ReservationDetailsDialog({
  open,
  reservationId,
  onClose,
}: {
  open: boolean;
  reservationId: string | null;
  onClose: () => void;
}) {
  const [reservation, setReservation] =
    useState<ApiGetReservationBackendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReservation(id: string) {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get<ApiGetReservationBackendResponse>(
        `/api/backend/reservations/${id}`,
      );

      setReservation(res.data);
    } catch (err) {
      console.error(err);
      setError('Reservierung konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !reservationId) return;

    loadReservation(reservationId);
  }, [open, reservationId]);

  useEffect(() => {
    if (!open) {
      setReservation(null);
      setError(null);
    }
  }, [open]);

  const invoice = reservation?.invoice ?? null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Reservierungsdetails</DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Stack spacing={2}>
            <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-24 w-full animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-24 w-full animate-pulse rounded-2xl bg-gray-100" />
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !reservation ? (
          <Alert severity="info">Keine Reservierung geladen.</Alert>
        ) : (
          <Stack spacing={3}>
            <Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
              >
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    {reservation.name}
                  </Typography>
                  <Typography color="text.secondary">
                    {reservation.email}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label={translateState(reservation.paymentStatus)}
                    color={paymentStatusColor(reservation.paymentStatus)}
                    variant="outlined"
                  />

                  <Chip label={reservation.type} variant="outlined" />
                </Stack>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                Buchung
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                  },
                  gap: 2,
                }}
              >
                <DetailItem label="Personen" value={reservation.people} />
                <DetailItem label="Tische" value={reservation.tableCount} />
                <DetailItem
                  label="Tischnummer"
                  value={reservation.tableNumber ?? '—'}
                />
                <DetailItem
                  label="Erstellt am"
                  value={formatDate(reservation.createdAt)}
                />
                <DetailItem
                  label="Bezahlt am"
                  value={formatDate(reservation.paidAt)}
                />
                <DetailItem
                  label="Storniert am"
                  value={formatDate(reservation.canceledAt)}
                />
              </Box>
            </Box>

            <Box>
              <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                Beträge
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                  },
                  gap: 2,
                }}
              >
                <DetailItem
                  label="Mindestverzehr"
                  value={formatEUR(reservation.minimumSpend)}
                />
                <DetailItem
                  label="Externer Ticketpreis"
                  value={formatEUR(reservation.externalTicketPrice)}
                />
              </Box>
            </Box>

            <Box>
              <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                Rechnung
              </Typography>

              {invoice ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                  >
                    <Box>
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
                      <Typography variant="body2" color="text.secondary">
                        Gesamt: {centsToEUR(invoice.totalCents)}
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      startIcon={<PictureAsPdfRounded />}
                      href={`/api/reservations/${reservation.id}/invoice`}
                      target="_blank"
                    >
                      PDF anzeigen
                    </Button>
                  </Stack>
                </Paper>
              ) : (
                <Alert severity="warning">
                  Für diese Reservierung wurde noch keine Rechnung erstellt.
                </Alert>
              )}
            </Box>

            {reservation.internalNotes && (
              <Box>
                <Typography fontWeight={800} sx={{ mb: 1 }}>
                  Interne Notizen
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    bgcolor: 'grey.50',
                  }}
                >
                  <Typography whiteSpace="pre-wrap">
                    {reservation.internalNotes}
                  </Typography>
                </Paper>
              </Box>
            )}

            <Box>
              <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                Adressen
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, minmax(0, 1fr))',
                  },
                  gap: 2,
                }}
              >
                <AddressPreview
                  title="Rechnungsadresse"
                  address={reservation.billingAddress}
                />

                <AddressPreview
                  title="Lieferadresse"
                  address={reservation.shippingAddress}
                  fallback={
                    reservation.shippingSameAsBilling
                      ? 'Entspricht der Rechnungsadresse'
                      : 'Keine Lieferadresse hinterlegt'
                  }
                />
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Box>
  );
}

function AddressPreview({
  title,
  address,
  fallback = 'Keine Adresse hinterlegt',
}: {
  title: string;
  address: unknown;
  fallback?: string;
}) {
  const lines = addressToLines(address);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
    >
      <Typography fontWeight={700} sx={{ mb: 1 }}>
        {title}
      </Typography>

      {lines.length > 0 ? (
        <Stack spacing={0.25}>
          {lines.map((line, index) => (
            <Typography key={index} variant="body2" color="text.secondary">
              {line}
            </Typography>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {fallback}
        </Typography>
      )}
    </Paper>
  );
}

function addressToLines(address: unknown): string[] {
  if (!address || typeof address !== 'object') return [];

  const a = address as Record<string, any>;

  const name = a.company || '';
  const line1 = a.line1 || '';
  const line2 = a.line2 || '';
  const cityLine = [a.postalCode, a.city].filter(Boolean).join(' ');
  const country = a.country || '';

  return [name, line1, line2, cityLine, country].filter(Boolean);
}
