import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import BackendHeader from '@/components/backend/header';
import BackendPermissionGuard from '@/components/backend/BackendPermissionGuard';
import { BACKEND_PERMISSIONS } from '@/lib/backend/permissions';
import type { Session } from '@/hooks/useSession';
import { centsToEUR } from '@/lib/helpers';

import type {
  BillingAddressInput,
  ParsedTebiReceipt,
} from '@/lib/receiptInvoice/types';
import {
  emptyBillingAddress,
  isCompleteBillingAddress,
} from '@/lib/receiptInvoice/types';

import type { ParseReceiptResponse } from '@/pages/api/backend/receiptInvoices/parse';
import type {
  ReceiptInvoiceReservationSearchItem,
  ReceiptInvoiceReservationSearchResponse,
} from '@/pages/api/backend/receiptInvoices/reservations/search';
import type { CreateReceiptInvoiceResponse } from '@/pages/api/backend/receiptInvoices';

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

function paymentStatusColor(status: string) {
  switch (status) {
    case 'PAID':
      return 'success' as const;

    case 'CANCELED':
    case 'REFUNDED':
      return 'default' as const;

    default:
      return 'warning' as const;
  }
}

export default function NewReceiptInvoicePage({
  session,
}: {
  session: Session;
}) {
  const [file, setFile] = useState<File | null>(null);

  const [parsedReceipt, setParsedReceipt] = useState<ParsedTebiReceipt | null>(
    null,
  );

  const [parseLoading, setParseLoading] = useState(false);

  const [q, setQ] = useState('');
  const [reservations, setReservations] = useState<
    ReceiptInvoiceReservationSearchItem[]
  >([]);

  const [reservationLoading, setReservationLoading] = useState(false);

  const [selectedReservation, setSelectedReservation] =
    useState<ReceiptInvoiceReservationSearchItem | null>(null);

  const [billingAddress, setBillingAddress] = useState<BillingAddressInput>(
    emptyBillingAddress(),
  );

  const [saveBillingAddress, setSaveBillingAddress] = useState(true);

  const [createLoading, setCreateLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  async function parseReceipt() {
    if (!file) {
      setError('Bitte wähle zunächst ein PDF aus.');
      return;
    }

    try {
      setParseLoading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post<ParseReceiptResponse>(
        '/api/backend/receiptInvoices/parse',
        formData,
      );

      setParsedReceipt(response.data.receipt);
    } catch (error) {
      console.error(error);

      setParsedReceipt(null);
      setError(
        getErrorMessage(error, 'Der Kassenbeleg konnte nicht gelesen werden.'),
      );
    } finally {
      setParseLoading(false);
    }
  }

  async function searchReservations() {
    try {
      setReservationLoading(true);
      setError(null);

      const response = await axios.get<ReceiptInvoiceReservationSearchResponse>(
        '/api/backend/receiptInvoices/reservations/search',
        {
          params: {
            q: q || undefined,
          },
        },
      );

      setReservations(response.data.reservations);
    } catch (error) {
      console.error(error);

      setError(
        getErrorMessage(error, 'Reservierungen konnten nicht geladen werden.'),
      );
    } finally {
      setReservationLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      searchReservations();
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function selectReservation(reservation: ReceiptInvoiceReservationSearchItem) {
    setSelectedReservation(reservation);

    setBillingAddress(reservation.billingAddress || emptyBillingAddress());

    setSuccess(null);
    setError(null);
  }

  function updateAddress<K extends keyof BillingAddressInput>(
    key: K,
    value: BillingAddressInput[K],
  ) {
    setBillingAddress((current) => ({
      ...current,
      [key]: value,
    }));
  }

  const addressComplete = useMemo(
    () => isCompleteBillingAddress(billingAddress),
    [billingAddress],
  );

  const canCreate =
    Boolean(file) &&
    Boolean(parsedReceipt) &&
    Boolean(selectedReservation) &&
    addressComplete &&
    !createLoading;

  async function createInvoice() {
    if (!file || !parsedReceipt || !selectedReservation) {
      setError('Bitte lade einen Beleg hoch und wähle eine Reservierung aus.');
      return;
    }

    if (!addressComplete) {
      setError('Bitte vervollständige die Rechnungsadresse.');
      return;
    }

    const popup = window.open('about:blank', '_blank');

    try {
      setCreateLoading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();

      formData.append('file', file);
      formData.append('reservationId', selectedReservation.id);
      formData.append('billingAddress', JSON.stringify(billingAddress));
      formData.append('saveBillingAddress', String(saveBillingAddress));

      const response = await axios.post<CreateReceiptInvoiceResponse>(
        '/api/backend/receiptInvoices',
        formData,
      );

      setSuccess(`${response.data.documentNumber} wurde erfolgreich erstellt.`);

      if (popup) {
        popup.location.href = response.data.pdfUrl;
      } else {
        window.location.href = response.data.pdfUrl;
      }
    } catch (error) {
      console.error(error);

      popup?.close();

      setError(
        getErrorMessage(error, 'Die Rechnung konnte nicht erstellt werden.'),
      );
    } finally {
      setCreateLoading(false);
    }
  }

  const reservationHasAddress =
    Boolean(selectedReservation?.billingAddress) &&
    isCompleteBillingAddress(selectedReservation?.billingAddress);

  return (
    <BackendPermissionGuard
      session={session}
      permission={BACKEND_PERMISSIONS.INVOICES}
      deniedTitle="Kein Zugriff auf Rechnungen"
      deniedDescription="Du hast keine Berechtigung, Rechnungsergänzungen zu erstellen."
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <Stack spacing={4}>
          <BackendHeader
            title="Rechnung zum Kassenbeleg"
            subtitle="Kassenbeleg hochladen, Reservierung zuordnen und eine vollständige Rechnungsergänzung erzeugen."
          />

          {error && <Alert severity="error">{error}</Alert>}

          {success && (
            <Alert severity="success" icon={<CheckCircleRoundedIcon />}>
              {success}
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
            <Box sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label="1" color="primary" size="small" />
                  <Typography variant="h6" fontWeight={800}>
                    Kassenbeleg hochladen
                  </Typography>
                </Stack>

                <Stack
                  direction={{
                    xs: 'column',
                    sm: 'row',
                  }}
                  spacing={2}
                  alignItems={{
                    xs: 'stretch',
                    sm: 'center',
                  }}
                >
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<UploadFileRoundedIcon />}
                  >
                    PDF auswählen
                    <input
                      hidden
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(event) => {
                        const nextFile = event.target.files?.[0] || null;

                        setFile(nextFile);
                        setParsedReceipt(null);
                        setSuccess(null);
                        setError(null);
                      }}
                    />
                  </Button>

                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={700}>
                      {file ? file.name : 'Noch keine Datei ausgewählt'}
                    </Typography>

                    {file && (
                      <Typography variant="body2" color="text.secondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    disabled={!file || parseLoading}
                    startIcon={
                      parseLoading ? (
                        <CircularProgress size={17} color="inherit" />
                      ) : (
                        <PictureAsPdfRoundedIcon />
                      )
                    }
                    onClick={parseReceipt}
                  >
                    Beleg auslesen
                  </Button>
                </Stack>

                {parsedReceipt && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      border: '1px solid',
                      borderColor: 'success.light',
                      bgcolor: 'success.50',
                      borderRadius: 3,
                    }}
                  >
                    <Stack spacing={2}>
                      <Stack
                        direction={{
                          xs: 'column',
                          sm: 'row',
                        }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Box>
                          <Typography fontWeight={800}>
                            Kassenbeleg {parsedReceipt.receiptNumber}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            Erstellt am {parsedReceipt.createdAtLabel}
                          </Typography>
                        </Box>

                        <Chip
                          color="success"
                          variant="outlined"
                          label="Erfolgreich ausgelesen"
                        />
                      </Stack>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr 1fr',
                            md: 'repeat(4, 1fr)',
                          },
                          gap: 2,
                        }}
                      >
                        <ReceiptValue
                          label="Netto"
                          value={centsToEUR(parsedReceipt.netCents)}
                        />

                        <ReceiptValue
                          label="Umsatzsteuer"
                          value={centsToEUR(parsedReceipt.vatCents)}
                        />

                        <ReceiptValue
                          label="Gesamt"
                          value={centsToEUR(parsedReceipt.grossCents)}
                        />

                        <ReceiptValue
                          label="Tisch"
                          value={parsedReceipt.tableNumber || '—'}
                        />
                      </Box>

                      {parsedReceipt.payments.length > 0 && (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {parsedReceipt.payments.map((payment) => (
                            <Chip
                              key={payment.label}
                              size="small"
                              variant="outlined"
                              label={`${payment.label}: ${centsToEUR(
                                payment.amountCents,
                              )}`}
                            />
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Box>

            <Divider />

            <Box sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label="2" color="primary" size="small" />
                  <Typography variant="h6" fontWeight={800}>
                    Reservierung auswählen
                  </Typography>
                </Stack>

                <TextField
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      searchReservations();
                    }
                  }}
                  label="Reservierung suchen"
                  placeholder="Name, E-Mail oder Tischnummer"
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Stack spacing={1.5}>
                  {reservationLoading ? (
                    Array.from({
                      length: 3,
                    }).map((_, index) => (
                      <div
                        key={index}
                        className="h-24 w-full animate-pulse rounded-2xl bg-gray-100"
                      />
                    ))
                  ) : reservations.length === 0 ? (
                    <Box
                      sx={{
                        py: 4,
                        textAlign: 'center',
                      }}
                    >
                      <Typography fontWeight={700}>
                        Keine Reservierungen gefunden
                      </Typography>
                    </Box>
                  ) : (
                    reservations.map((reservation) => {
                      const isSelected =
                        selectedReservation?.id === reservation.id;

                      return (
                        <Paper
                          key={reservation.id}
                          elevation={0}
                          onClick={() => selectReservation(reservation)}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: isSelected
                              ? 'primary.main'
                              : 'divider',
                            borderRadius: 3,
                            transition: 'border-color 150ms ease',
                          }}
                        >
                          <Stack
                            direction={{
                              xs: 'column',
                              sm: 'row',
                            }}
                            justifyContent="space-between"
                            spacing={2}
                          >
                            <Box>
                              <Typography fontWeight={800}>
                                {reservation.name}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {reservation.email}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {reservation.people} Personen ·{' '}
                                {reservation.type}
                                {reservation.tableNumber
                                  ? ` · Tisch ${reservation.tableNumber}`
                                  : ''}
                              </Typography>
                            </Box>

                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                            >
                              <Chip
                                size="small"
                                variant="outlined"
                                color={paymentStatusColor(
                                  reservation.paymentStatus,
                                )}
                                label={reservation.paymentStatus}
                              />

                              <Chip
                                size="small"
                                variant="outlined"
                                color={
                                  isCompleteBillingAddress(
                                    reservation.billingAddress,
                                  )
                                    ? 'success'
                                    : 'warning'
                                }
                                label={
                                  isCompleteBillingAddress(
                                    reservation.billingAddress,
                                  )
                                    ? 'Adresse vorhanden'
                                    : 'Adresse fehlt'
                                }
                              />

                              {isSelected && (
                                <CheckCircleRoundedIcon color="primary" />
                              )}
                            </Stack>
                          </Stack>
                        </Paper>
                      );
                    })
                  )}
                </Stack>
              </Stack>
            </Box>

            <Divider />

            <Box sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label="3" color="primary" size="small" />
                  <Typography variant="h6" fontWeight={800}>
                    Rechnungsadresse
                  </Typography>
                </Stack>

                {!selectedReservation ? (
                  <Alert severity="info">
                    Wähle zunächst eine Reservierung aus.
                  </Alert>
                ) : (
                  <>
                    {!reservationHasAddress && (
                      <Alert severity="warning">
                        Für diese Reservierung ist keine vollständige
                        Rechnungsadresse hinterlegt. Bitte ergänze die Angaben.
                      </Alert>
                    )}

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
                      <TextField
                        label="Firma"
                        required
                        value={billingAddress.company}
                        onChange={(event) =>
                          updateAddress('company', event.target.value)
                        }
                      />

                      <TextField
                        label="Ansprechpartner"
                        value={billingAddress.contactName || ''}
                        onChange={(event) =>
                          updateAddress('contactName', event.target.value)
                        }
                      />

                      <TextField
                        label="Straße und Hausnummer"
                        required
                        value={billingAddress.line1}
                        onChange={(event) =>
                          updateAddress('line1', event.target.value)
                        }
                        sx={{
                          gridColumn: {
                            sm: 'span 2',
                          },
                        }}
                      />

                      <TextField
                        label="Adresszusatz"
                        value={billingAddress.line2 || ''}
                        onChange={(event) =>
                          updateAddress('line2', event.target.value)
                        }
                        sx={{
                          gridColumn: {
                            sm: 'span 2',
                          },
                        }}
                      />

                      <TextField
                        label="Postleitzahl"
                        required
                        value={billingAddress.postalCode}
                        onChange={(event) =>
                          updateAddress('postalCode', event.target.value)
                        }
                      />

                      <TextField
                        label="Ort"
                        required
                        value={billingAddress.city}
                        onChange={(event) =>
                          updateAddress('city', event.target.value)
                        }
                      />

                      <TextField
                        label="Land"
                        required
                        value={billingAddress.country}
                        onChange={(event) =>
                          updateAddress('country', event.target.value)
                        }
                        sx={{
                          gridColumn: {
                            sm: 'span 2',
                          },
                        }}
                      />
                    </Box>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={saveBillingAddress}
                          onChange={(event) =>
                            setSaveBillingAddress(event.target.checked)
                          }
                        />
                      }
                      label="Rechnungsadresse dauerhaft in der Reservierung speichern"
                    />
                  </>
                )}
              </Stack>
            </Box>

            <Divider />

            <Box sx={{ p: 3 }}>
              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row',
                }}
                justifyContent="space-between"
                alignItems={{
                  xs: 'stretch',
                  sm: 'center',
                }}
                spacing={2}
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label="4" color="primary" size="small" />

                    <Typography variant="h6" fontWeight={800}>
                      PDF erzeugen
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Die Rechnungsergänzung wird als erste Seite vor den
                    Original-Kassenbeleg gesetzt.
                  </Typography>
                </Box>

                <Button
                  size="large"
                  variant="contained"
                  disabled={!canCreate}
                  startIcon={
                    createLoading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <PictureAsPdfRoundedIcon />
                    )
                  }
                  onClick={createInvoice}
                >
                  Rechnung erzeugen & öffnen
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Stack>
      </div>
    </BackendPermissionGuard>
  );
}

function ReceiptValue({
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

      <Typography fontWeight={800}>{value}</Typography>
    </Box>
  );
}
