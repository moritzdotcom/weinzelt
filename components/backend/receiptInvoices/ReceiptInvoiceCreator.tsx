import * as React from 'react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/router';
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
  IconButton,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';

import BackendHeader from '@/components/backend/header';
import { centsToEUR } from '@/lib/helpers';

import {
  emptyBillingAddress,
  isCompleteBillingAddress,
  modeToQuery,
  parseReceiptInvoiceMode,
  type BillingAddressInput,
  type CreateReceiptInvoiceCaseResponse,
  type CreatedReceiptInvoiceDocument,
  type ParsedTebiReceipt,
  type ParseReceiptResponse,
  type ReceiptAssignmentType,
  type ReceiptInvoiceMode,
  type ReceiptInvoiceReservationSearchItem,
  type ReceiptInvoiceReservationSearchResponse,
  type SplitRecipientInput,
} from '@/lib/receiptInvoice/types';

type UploadState = {
  id: string;
  file: File;
  status: 'PARSING' | 'READY' | 'ERROR';
  receipt: ParsedTebiReceipt | null;
  error: string | null;
};

type SplitRecipientState =
  SplitRecipientInput & {
    id: string;
  };

function localId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message;

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

function paymentStatusColor(
  status: string,
) {
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

function newSplitRecipient(
  receipt: ParsedTebiReceipt,
): SplitRecipientState {
  return {
    id: localId(),
    email: '',
    billingAddress:
      emptyBillingAddress(),
    allocations:
      receipt.taxLines.map(
        (taxLine) => ({
          rate: taxLine.rate,
          grossCents: 0,
        }),
      ),
    tipCents: 0,
  };
}

export function ReceiptInvoiceCreator() {
  const router = useRouter();

  const mode = parseReceiptInvoiceMode(
    router.query.mode,
  );

  const [uploads, setUploads] =
    useState<UploadState[]>([]);

  const [assignmentType, setAssignmentType] =
    useState<ReceiptAssignmentType>(
      'RESERVATION',
    );

  const [q, setQ] = useState('');
  const [reservations, setReservations] =
    useState<
      ReceiptInvoiceReservationSearchItem[]
    >([]);

  const [
    reservationLoading,
    setReservationLoading,
  ] = useState(false);

  const [
    selectedReservation,
    setSelectedReservation,
  ] =
    useState<ReceiptInvoiceReservationSearchItem | null>(
      null,
    );

  const [recipientEmail, setRecipientEmail] =
    useState('');

  const [
    billingAddress,
    setBillingAddress,
  ] = useState<BillingAddressInput>(
    emptyBillingAddress(),
  );

  const [
    saveBillingAddress,
    setSaveBillingAddress,
  ] = useState(true);

  const [
    splitRecipients,
    setSplitRecipients,
  ] = useState<
    SplitRecipientState[]
  >([]);

  const [createLoading, setCreateLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [
    createdDocuments,
    setCreatedDocuments,
  ] = useState<
    CreatedReceiptInvoiceDocument[]
  >([]);

  const initializedMode =
    useRef<ReceiptInvoiceMode | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    if (
      initializedMode.current === null
    ) {
      initializedMode.current = mode;
      return;
    }

    if (
      initializedMode.current !== mode
    ) {
      initializedMode.current = mode;
      setUploads([]);
      setSelectedReservation(null);
      setQ('');
      setReservations([]);
      setRecipientEmail('');
      setBillingAddress(
        emptyBillingAddress(),
      );
      setSplitRecipients([]);
      setCreatedDocuments([]);
      setError(null);
      setAssignmentType(
        mode === 'COLLECTION'
          ? 'RESERVATION'
          : 'RESERVATION',
      );
    }
  }, [mode, router.isReady]);

  const readyReceipts = useMemo(
    () =>
      uploads
        .filter(
          (
            upload,
          ): upload is UploadState & {
            receipt: ParsedTebiReceipt;
          } =>
            upload.status ===
              'READY' &&
            Boolean(upload.receipt),
        )
        .map(
          (upload) =>
            upload.receipt,
        ),
    [uploads],
  );

  const allUploadsReady =
    uploads.length > 0 &&
    uploads.every(
      (upload) =>
        upload.status === 'READY',
    );

  const expectedFileCountValid =
    mode === 'COLLECTION'
      ? uploads.length >= 2
      : uploads.length === 1;

  const reservationRequired =
    mode === 'COLLECTION' ||
    assignmentType === 'RESERVATION';

  async function searchReservations() {
    if (!reservationRequired) return;

    try {
      setReservationLoading(true);

      const response =
        await axios.get<ReceiptInvoiceReservationSearchResponse>(
          '/api/backend/receiptInvoices/reservations/search',
          {
            params: {
              q: q || undefined,
            },
          },
        );

      setReservations(
        response.data.reservations,
      );
    } catch (error) {
      console.error(error);

      setError(
        getErrorMessage(
          error,
          'Reservierungen konnten nicht geladen werden.',
        ),
      );
    } finally {
      setReservationLoading(false);
    }
  }

  useEffect(() => {
    if (!reservationRequired) return;

    const timeout = window.setTimeout(
      searchReservations,
      400,
    );

    return () => {
      window.clearTimeout(timeout);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, reservationRequired]);

  function changeMode(
    nextMode: ReceiptInvoiceMode,
  ) {
    router.replace(
      {
        pathname: router.pathname,
        query: {
          mode: modeToQuery(nextMode),
        },
      },
      undefined,
      {
        shallow: true,
      },
    );
  }

  async function parseUpload(
    upload: UploadState,
  ) {
    try {
      const formData = new FormData();

      formData.append(
        'file',
        upload.file,
      );

      const response =
        await axios.post<ParseReceiptResponse>(
          '/api/backend/receiptInvoices/parse',
          formData,
        );

      const receipt =
        response.data.receipt;

      setUploads((current) =>
        current.map((item) =>
          item.id === upload.id
            ? {
                ...item,
                status: 'READY',
                receipt,
                error: null,
              }
            : item,
        ),
      );

      if (mode === 'SPLIT') {
        setSplitRecipients([
          newSplitRecipient(receipt),
          newSplitRecipient(receipt),
        ]);
      }
    } catch (error) {
      console.error(error);

      const message = getErrorMessage(
        error,
        'Der Kassenbeleg konnte nicht gelesen werden.',
      );

      setUploads((current) =>
        current.map((item) =>
          item.id === upload.id
            ? {
                ...item,
                status: 'ERROR',
                receipt: null,
                error: message,
              }
            : item,
        ),
      );
    }
  }

  function addFiles(
    selectedFiles: File[],
  ) {
    setError(null);
    setCreatedDocuments([]);

    const pdfFiles = selectedFiles.filter(
      (file) =>
        file.type ===
          'application/pdf' ||
        file.name
          .toLowerCase()
          .endsWith('.pdf'),
    );

    if (
      pdfFiles.length !==
      selectedFiles.length
    ) {
      setError(
        'Es sind ausschließlich PDF-Dateien erlaubt.',
      );
    }

    const selected =
      mode === 'COLLECTION'
        ? pdfFiles
        : pdfFiles.slice(0, 1);

    if (selected.length === 0) {
      return;
    }

    const nextUploads =
      selected.map(
        (file): UploadState => ({
          id: localId(),
          file,
          status: 'PARSING',
          receipt: null,
          error: null,
        }),
      );

    setUploads((current) =>
      mode === 'COLLECTION'
        ? [...current, ...nextUploads]
        : nextUploads,
    );

    for (const upload of nextUploads) {
      void parseUpload(upload);
    }
  }

  function removeUpload(id: string) {
    setUploads((current) =>
      current.filter(
        (upload) => upload.id !== id,
      ),
    );

    if (mode === 'SPLIT') {
      setSplitRecipients([]);
    }

    setCreatedDocuments([]);
  }

  function selectReservation(
    reservation: ReceiptInvoiceReservationSearchItem,
  ) {
    setSelectedReservation(
      reservation,
    );

    if (
      mode === 'SINGLE' ||
      mode === 'COLLECTION'
    ) {
      setRecipientEmail(
        reservation.email,
      );

      setBillingAddress(
        reservation.billingAddress ||
          emptyBillingAddress(),
      );
    }

    setError(null);
    setCreatedDocuments([]);
  }

  function updateAddress<
    K extends keyof BillingAddressInput,
  >(
    key: K,
    value: BillingAddressInput[K],
  ) {
    setBillingAddress(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  }

  function updateSplitRecipient(
    id: string,
    updater: (
      current: SplitRecipientState,
    ) => SplitRecipientState,
  ) {
    setSplitRecipients((current) =>
      current.map((recipient) =>
        recipient.id === id
          ? updater(recipient)
          : recipient,
      ),
    );

    setCreatedDocuments([]);
  }

  function addSplitRecipient() {
    const receipt = readyReceipts[0];

    if (!receipt) return;

    setSplitRecipients((current) => [
      ...current,
      newSplitRecipient(receipt),
    ]);
  }

  function removeSplitRecipient(
    id: string,
  ) {
    setSplitRecipients((current) =>
      current.filter(
        (recipient) =>
          recipient.id !== id,
      ),
    );
  }

  const splitValidation = useMemo(() => {
    if (
      mode !== 'SPLIT' ||
      readyReceipts.length !== 1
    ) {
      return {
        errors: [] as string[],
        remainingByRate: [] as Array<{
          rate: number;
          remainingCents: number;
        }>,
        remainingTipCents: 0,
      };
    }

    const receipt = readyReceipts[0];
    const errors: string[] = [];

    if (splitRecipients.length < 2) {
      errors.push(
        'Mindestens zwei Empfänger erforderlich.',
      );
    }

    splitRecipients.forEach(
      (recipient, index) => {
        if (
          !isCompleteBillingAddress(
            recipient.billingAddress,
          )
        ) {
          errors.push(
            `Adresse von Empfänger ${
              index + 1
            } unvollständig.`,
          );
        }

        const total =
          recipient.allocations.reduce(
            (sum, allocation) =>
              sum +
              allocation.grossCents,
            0,
          ) + recipient.tipCents;

        if (total <= 0) {
          errors.push(
            `Empfänger ${
              index + 1
            } hat keinen Betrag.`,
          );
        }
      },
    );

    const remainingByRate =
      receipt.taxLines.map(
        (taxLine) => {
          const allocated =
            splitRecipients.reduce(
              (sum, recipient) =>
                sum +
                (recipient.allocations.find(
                  (allocation) =>
                    allocation.rate ===
                    taxLine.rate,
                )?.grossCents ?? 0),
              0,
            );

          const remainingCents =
            taxLine.grossCents -
            allocated;

          if (remainingCents !== 0) {
            errors.push(
              `${taxLine.rate.toLocaleString(
                'de-DE',
              )} % MwSt. noch nicht vollständig verteilt.`,
            );
          }

          return {
            rate: taxLine.rate,
            remainingCents,
          };
        },
      );

    const allocatedTip =
      splitRecipients.reduce(
        (sum, recipient) =>
          sum + recipient.tipCents,
        0,
      );

    const remainingTipCents =
      receipt.tipCents -
      allocatedTip;

    if (remainingTipCents !== 0) {
      errors.push(
        'Das Trinkgeld ist noch nicht vollständig verteilt.',
      );
    }

    return {
      errors,
      remainingByRate,
      remainingTipCents,
    };
  }, [
    mode,
    readyReceipts,
    splitRecipients,
  ]);

  const singleAddressComplete =
    isCompleteBillingAddress(
      billingAddress,
    );

  const canCreate =
    allUploadsReady &&
    expectedFileCountValid &&
    (!reservationRequired ||
      Boolean(selectedReservation)) &&
    (mode === 'SPLIT'
      ? splitValidation.errors.length ===
        0
      : singleAddressComplete) &&
    !createLoading;

  async function createDocuments() {
    if (!canCreate) {
      setError(
        'Bitte vervollständige alle erforderlichen Angaben.',
      );
      return;
    }

    const popup = window.open(
      'about:blank',
      '_blank',
    );

    try {
      setCreateLoading(true);
      setError(null);
      setCreatedDocuments([]);

      const formData = new FormData();

      formData.append('mode', mode);

      if (selectedReservation) {
        formData.append(
          'reservationId',
          selectedReservation.id,
        );
      }

      const configuration =
        mode === 'SPLIT'
          ? {
              mode: 'SPLIT' as const,
              assignmentType,
              recipients:
                splitRecipients.map(
                  ({
                    id: _id,
                    ...recipient
                  }) => recipient,
                ),
            }
          : {
              mode,
              assignmentType:
                mode === 'COLLECTION'
                  ? ('RESERVATION' as const)
                  : assignmentType,
              recipient: {
                email:
                  recipientEmail ||
                  undefined,
                billingAddress,
              },
              saveBillingAddress:
                Boolean(
                  selectedReservation,
                ) &&
                saveBillingAddress,
            };

      formData.append(
        'configuration',
        JSON.stringify(configuration),
      );

      for (const upload of uploads) {
        formData.append(
          'files',
          upload.file,
        );
      }

      const response =
        await axios.post<CreateReceiptInvoiceCaseResponse>(
          '/api/backend/receiptInvoices/cases',
          formData,
        );

      setCreatedDocuments(
        response.data.documents,
      );

      const firstDocument =
        response.data.documents[0];

      if (firstDocument && popup) {
        popup.location.href =
          firstDocument.pdfUrl;
      } else {
        popup?.close();
      }
    } catch (error) {
      console.error(error);
      popup?.close();

      setError(
        getErrorMessage(
          error,
          'Der Rechnungsvorgang konnte nicht erstellt werden.',
        ),
      );
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <Stack spacing={4}>
      <BackendHeader
        title="Rechnung zum Kassenbeleg"
        subtitle="Einzelbelege, Sammelbelege und aufgeteilte Belege erstellen."
        backHref="/backend/receiptInvoices"
        backLabel="Zurück zur Übersicht"
      />

      <ModeSelector
        mode={mode}
        onChange={changeMode}
      />

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {createdDocuments.length > 0 && (
        <Alert
          severity="success"
          icon={
            <CheckCircleRoundedIcon />
          }
        >
          <Stack spacing={1}>
            <Typography fontWeight={700}>
              {createdDocuments.length === 1
                ? 'Das Dokument wurde erfolgreich erstellt.'
                : `${createdDocuments.length} Teilrechnungen wurden erfolgreich erstellt.`}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
            >
              {createdDocuments.map(
                (document) => (
                  <Button
                    key={document.id}
                    size="small"
                    color="inherit"
                    variant="outlined"
                    href={document.pdfUrl}
                    target="_blank"
                    startIcon={
                      <PictureAsPdfRoundedIcon />
                    }
                  >
                    {
                      document.documentNumber
                    }
                  </Button>
                ),
              )}
            </Stack>
          </Stack>
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
        <Section
          number={1}
          title={
            mode === 'COLLECTION'
              ? 'Kassenbelege hochladen'
              : 'Kassenbeleg hochladen'
          }
        >
          <ReceiptUploader
            mode={mode}
            uploads={uploads}
            onAddFiles={addFiles}
            onRemove={removeUpload}
          />
        </Section>

        <Divider />

        <Section
          number={2}
          title="Zuordnung"
        >
          {mode !== 'COLLECTION' && (
            <RadioGroup
              row
              value={assignmentType}
              onChange={(event) => {
                const next =
                  event.target
                    .value as ReceiptAssignmentType;

                setAssignmentType(next);
                setSelectedReservation(
                  null,
                );
                setRecipientEmail('');
                setBillingAddress(
                  emptyBillingAddress(),
                );
                setCreatedDocuments([]);
              }}
            >
              <FormControlLabel
                value="RESERVATION"
                control={<Radio />}
                label="Mit Reservierung"
              />

              <FormControlLabel
                value="MANUAL"
                control={<Radio />}
                label="Ohne Reservierung"
              />
            </RadioGroup>
          )}

          {mode === 'COLLECTION' && (
            <Alert severity="info">
              Ein Sammelbeleg wird immer
              einer Reservierung zugeordnet.
            </Alert>
          )}

          {reservationRequired ? (
            <ReservationSelector
              q={q}
              onQueryChange={setQ}
              loading={reservationLoading}
              reservations={reservations}
              selectedId={
                selectedReservation?.id ??
                null
              }
              onSelect={selectReservation}
              onSearch={searchReservations}
            />
          ) : (
            <Alert severity="info">
              Der Beleg wird ohne
              Reservierungsbezug erstellt.
            </Alert>
          )}
        </Section>

        <Divider />

        <Section
          number={3}
          title={
            mode === 'SPLIT'
              ? 'Rechnungsempfänger und Aufteilung'
              : 'Rechnungsempfänger'
          }
        >
          {mode === 'SPLIT' ? (
            <SplitRecipientsEditor
              receipt={readyReceipts[0] ?? null}
              recipients={
                splitRecipients
              }
              onAdd={addSplitRecipient}
              onRemove={
                removeSplitRecipient
              }
              onChange={
                updateSplitRecipient
              }
              validation={
                splitValidation
              }
            />
          ) : (
            <Stack spacing={2.5}>
              {reservationRequired &&
              !selectedReservation ? (
                <Alert severity="info">
                  Wähle zunächst eine
                  Reservierung aus.
                </Alert>
              ) : (
                <>
                  {selectedReservation &&
                    !isCompleteBillingAddress(
                      selectedReservation.billingAddress,
                    ) && (
                      <Alert severity="warning">
                        Für diese
                        Reservierung ist keine
                        vollständige
                        Rechnungsadresse
                        hinterlegt.
                      </Alert>
                    )}

                  <TextField
                    label="E-Mail für den Rechnungsempfänger"
                    value={
                      recipientEmail
                    }
                    onChange={(event) =>
                      setRecipientEmail(
                        event.target.value,
                      )
                    }
                    type="email"
                    fullWidth
                  />

                  <BillingAddressForm
                    value={billingAddress}
                    onChange={
                      updateAddress
                    }
                  />

                  {selectedReservation && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            saveBillingAddress
                          }
                          onChange={(
                            event,
                          ) =>
                            setSaveBillingAddress(
                              event.target
                                .checked,
                            )
                          }
                        />
                      }
                      label="Rechnungsadresse dauerhaft in der Reservierung speichern"
                    />
                  )}
                </>
              )}
            </Stack>
          )}
        </Section>

        <Divider />

        <Section
          number={4}
          title="PDF erzeugen"
        >
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
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {mode === 'COLLECTION'
                  ? 'Alle Originalbelege werden an das Sammeldokument angehängt.'
                  : mode === 'SPLIT'
                    ? 'Für jeden Empfänger wird ein eigenes PDF erzeugt. Der vollständige Originalbeleg wird jeweils als Referenz angehängt.'
                    : 'Die Rechnungsergänzung wird vor den Original-Kassenbeleg gesetzt.'}
              </Typography>
            </Box>

            <Button
              size="large"
              variant="contained"
              disabled={!canCreate}
              startIcon={
                createLoading ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : (
                  <PictureAsPdfRoundedIcon />
                )
              }
              onClick={createDocuments}
            >
              {mode === 'SPLIT'
                ? 'Teilrechnungen erzeugen'
                : 'Rechnung erzeugen & öffnen'}
            </Button>
          </Stack>
        </Section>
      </Paper>
    </Stack>
  );
}

function ModeSelector({
  mode,
  onChange,
}: {
  mode: ReceiptInvoiceMode;
  onChange: (
    mode: ReceiptInvoiceMode,
  ) => void;
}) {
  const options: Array<{
    mode: ReceiptInvoiceMode;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      mode: 'SINGLE',
      title: 'Einzelbeleg',
      description:
        'Ein Beleg, ein Empfänger, Reservierung optional.',
      icon: <DescriptionRoundedIcon />,
    },
    {
      mode: 'COLLECTION',
      title: 'Sammelbeleg',
      description:
        'Mehrere Belege zu einer Reservierung zusammenfassen.',
      icon: <GroupsRoundedIcon />,
    },
    {
      mode: 'SPLIT',
      title: 'Beleg aufteilen',
      description:
        'Einen Beleg auf mehrere Empfänger verteilen.',
      icon: <DescriptionRoundedIcon />,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      {options.map((option) => {
        const selected =
          option.mode === mode;

        return (
          <Paper
            key={option.mode}
            component="button"
            type="button"
            elevation={0}
            onClick={() =>
              onChange(option.mode)
            }
            sx={{
              p: 2.5,
              textAlign: 'left',
              cursor: 'pointer',
              border: '2px solid',
              borderColor: selected
                ? 'primary.main'
                : 'divider',
              borderRadius: 3,
              bgcolor: selected
                ? 'action.selected'
                : 'background.paper',
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
            >
              <Box
                sx={{
                  mt: 0.25,
                  color: selected
                    ? 'primary.main'
                    : 'text.secondary',
                }}
              >
                {option.icon}
              </Box>

              <Box>
                <Typography
                  fontWeight={800}
                >
                  {option.title}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {option.description}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2.5}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Chip
            label={number}
            color="primary"
            size="small"
          />

          <Typography
            variant="h6"
            fontWeight={800}
          >
            {title}
          </Typography>
        </Stack>

        {children}
      </Stack>
    </Box>
  );
}

function ReceiptUploader({
  mode,
  uploads,
  onAddFiles,
  onRemove,
}: {
  mode: ReceiptInvoiceMode;
  uploads: UploadState[];
  onAddFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Stack spacing={2}>
      <Button
        component="label"
        variant="outlined"
        startIcon={
          <UploadFileRoundedIcon />
        }
        sx={{ alignSelf: 'flex-start' }}
      >
        {mode === 'COLLECTION'
          ? 'PDFs auswählen'
          : 'PDF auswählen'}

        <input
          hidden
          multiple={
            mode === 'COLLECTION'
          }
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => {
            const files = Array.from(
              event.target.files ?? [],
            );

            onAddFiles(files);
            event.target.value = '';
          }}
        />
      </Button>

      {mode === 'COLLECTION' &&
        uploads.length < 2 && (
          <Alert severity="info">
            Für einen Sammelbeleg
            werden mindestens zwei
            Kassenbelege benötigt.
          </Alert>
        )}

      {uploads.length === 0 ? (
        <Box
          sx={{
            py: 4,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Typography fontWeight={700}>
            Noch kein Kassenbeleg
            ausgewählt
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Die PDFs werden nach dem
            Auswählen automatisch
            ausgelesen.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {uploads.map((upload) => (
            <Paper
              key={upload.id}
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor:
                  upload.status ===
                  'ERROR'
                    ? 'error.light'
                    : upload.status ===
                        'READY'
                      ? 'success.light'
                      : 'divider',
                borderRadius: 3,
              }}
            >
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
                  <Typography
                    fontWeight={800}
                  >
                    {upload.receipt
                      ? `Kassenbeleg ${upload.receipt.receiptNumber}`
                      : upload.file.name}
                  </Typography>

                  {upload.status ===
                    'PARSING' && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Beleg wird
                      ausgelesen...
                    </Typography>
                  )}

                  {upload.receipt && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {
                        upload.receipt
                          .createdAtLabel
                      }{' '}
                      ·{' '}
                      {centsToEUR(
                        upload.receipt
                          .grossCents,
                      )}
                      {upload.receipt
                        .tableNumber
                        ? ` · Tisch ${upload.receipt.tableNumber}`
                        : ''}
                    </Typography>
                  )}

                  {upload.error && (
                    <Typography
                      variant="body2"
                      color="error"
                    >
                      {upload.error}
                    </Typography>
                  )}
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  {upload.status ===
                    'PARSING' && (
                    <CircularProgress
                      size={22}
                    />
                  )}

                  {upload.status ===
                    'READY' && (
                    <Chip
                      size="small"
                      color="success"
                      variant="outlined"
                      label="Ausgelesen"
                    />
                  )}

                  <Tooltip title="Entfernen">
                    <IconButton
                      onClick={() =>
                        onRemove(upload.id)
                      }
                    >
                      <CloseRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function ReservationSelector({
  q,
  onQueryChange,
  loading,
  reservations,
  selectedId,
  onSelect,
  onSearch,
}: {
  q: string;
  onQueryChange: (
    value: string,
  ) => void;
  loading: boolean;
  reservations:
    ReceiptInvoiceReservationSearchItem[];
  selectedId: string | null;
  onSelect: (
    reservation: ReceiptInvoiceReservationSearchItem,
  ) => void;
  onSearch: () => void;
}) {
  return (
    <Stack spacing={2}>
      <TextField
        value={q}
        onChange={(event) =>
          onQueryChange(
            event.target.value,
          )
        }
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onSearch();
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
        {loading ? (
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
              Keine Reservierungen
              gefunden
            </Typography>
          </Box>
        ) : (
          reservations.map(
            (reservation) => {
              const selected =
                reservation.id ===
                selectedId;

              return (
                <Paper
                  key={reservation.id}
                  elevation={0}
                  onClick={() =>
                    onSelect(
                      reservation,
                    )
                  }
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: selected
                      ? 'primary.main'
                      : 'divider',
                    borderRadius: 3,
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
                      <Typography
                        fontWeight={800}
                      >
                        {
                          reservation.name
                        }
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {
                          reservation.email
                        }
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {
                          reservation.people
                        }{' '}
                        Personen ·{' '}
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
                        label={
                          reservation.paymentStatus
                        }
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

                      {selected && (
                        <CheckCircleRoundedIcon color="primary" />
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              );
            },
          )
        )}
      </Stack>
    </Stack>
  );
}

function BillingAddressForm({
  value,
  onChange,
}: {
  value: BillingAddressInput;
  onChange: <
    K extends keyof BillingAddressInput,
  >(
    key: K,
    value: BillingAddressInput[K],
  ) => void;
}) {
  return (
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
        value={value.company}
        onChange={(event) =>
          onChange(
            'company',
            event.target.value,
          )
        }
      />

      <TextField
        label="Ansprechpartner"
        value={
          value.contactName || ''
        }
        onChange={(event) =>
          onChange(
            'contactName',
            event.target.value,
          )
        }
      />

      <TextField
        label="Straße und Hausnummer"
        required
        value={value.line1}
        onChange={(event) =>
          onChange(
            'line1',
            event.target.value,
          )
        }
        sx={{
          gridColumn: {
            sm: 'span 2',
          },
        }}
      />

      <TextField
        label="Adresszusatz"
        value={value.line2 || ''}
        onChange={(event) =>
          onChange(
            'line2',
            event.target.value,
          )
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
        value={value.postalCode}
        onChange={(event) =>
          onChange(
            'postalCode',
            event.target.value,
          )
        }
      />

      <TextField
        label="Ort"
        required
        value={value.city}
        onChange={(event) =>
          onChange(
            'city',
            event.target.value,
          )
        }
      />

      <TextField
        label="Land"
        required
        value={value.country}
        onChange={(event) =>
          onChange(
            'country',
            event.target.value,
          )
        }
        sx={{
          gridColumn: {
            sm: 'span 2',
          },
        }}
      />
    </Box>
  );
}

function SplitRecipientsEditor({
  receipt,
  recipients,
  onAdd,
  onRemove,
  onChange,
  validation,
}: {
  receipt: ParsedTebiReceipt | null;
  recipients: SplitRecipientState[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (
    id: string,
    updater: (
      current: SplitRecipientState,
    ) => SplitRecipientState,
  ) => void;
  validation: {
    errors: string[];
    remainingByRate: Array<{
      rate: number;
      remainingCents: number;
    }>;
    remainingTipCents: number;
  };
}) {
  if (!receipt) {
    return (
      <Alert severity="info">
        Lade zunächst einen
        Kassenbeleg hoch.
      </Alert>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Alert
        severity={
          validation.errors.length ===
          0
            ? 'success'
            : 'warning'
        }
      >
        <Stack spacing={0.5}>
          <Typography fontWeight={700}>
            {validation.errors.length ===
            0
              ? 'Der Kassenbeleg ist vollständig verteilt.'
              : 'Noch zu verteilen'}
          </Typography>

          {validation.remainingByRate.map(
            (item) => (
              <Typography
                key={item.rate}
                variant="body2"
              >
                {item.rate.toLocaleString(
                  'de-DE',
                )}{' '}
                % MwSt.:{' '}
                {centsToEUR(
                  item.remainingCents,
                )}
              </Typography>
            ),
          )}

          {receipt.tipCents > 0 && (
            <Typography variant="body2">
              Trinkgeld:{' '}
              {centsToEUR(
                validation.remainingTipCents,
              )}
            </Typography>
          )}
        </Stack>
      </Alert>

      {recipients.map(
        (recipient, index) => (
          <Paper
            key={recipient.id}
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <Stack spacing={2.5}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  variant="h6"
                  fontWeight={800}
                >
                  Empfänger {index + 1}
                </Typography>

                {recipients.length >
                  2 && (
                  <Tooltip title="Empfänger entfernen">
                    <IconButton
                      color="error"
                      onClick={() =>
                        onRemove(
                          recipient.id,
                        )
                      }
                    >
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>

              <TextField
                label="E-Mail"
                type="email"
                value={
                  recipient.email || ''
                }
                onChange={(event) =>
                  onChange(
                    recipient.id,
                    (current) => ({
                      ...current,
                      email:
                        event.target.value,
                    }),
                  )
                }
                fullWidth
              />

              <BillingAddressForm
                value={
                  recipient.billingAddress
                }
                onChange={(key, value) =>
                  onChange(
                    recipient.id,
                    (current) => ({
                      ...current,
                      billingAddress: {
                        ...current.billingAddress,
                        [key]: value,
                      },
                    }),
                  )
                }
              />

              <Divider />

              <Typography fontWeight={800}>
                Betragsaufteilung
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
                {receipt.taxLines.map(
                  (taxLine) => {
                    const allocation =
                      recipient.allocations.find(
                        (item) =>
                          item.rate ===
                          taxLine.rate,
                      );

                    return (
                      <TextField
                        key={taxLine.rate}
                        label={`Brutto mit ${taxLine.rate.toLocaleString(
                          'de-DE',
                        )} % MwSt.`}
                        type="number"
                        value={
                          (allocation?.grossCents ??
                            0) / 100
                        }
                        inputProps={{
                          min: 0,
                          step: 0.01,
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              €
                            </InputAdornment>
                          ),
                        }}
                        onChange={(event) => {
                          const cents =
                            Math.max(
                              0,
                              Math.round(
                                Number(
                                  event.target
                                    .value ||
                                    0,
                                ) * 100,
                              ),
                            );

                          onChange(
                            recipient.id,
                            (current) => ({
                              ...current,
                              allocations:
                                current.allocations.map(
                                  (
                                    currentAllocation,
                                  ) =>
                                    currentAllocation.rate ===
                                    taxLine.rate
                                      ? {
                                          ...currentAllocation,
                                          grossCents:
                                            cents,
                                        }
                                      : currentAllocation,
                                ),
                            }),
                          );
                        }}
                      />
                    );
                  },
                )}

                {receipt.tipCents > 0 && (
                  <TextField
                    label="Trinkgeld"
                    type="number"
                    value={
                      recipient.tipCents /
                      100
                    }
                    inputProps={{
                      min: 0,
                      step: 0.01,
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          €
                        </InputAdornment>
                      ),
                    }}
                    onChange={(event) => {
                      const cents =
                        Math.max(
                          0,
                          Math.round(
                            Number(
                              event.target
                                .value || 0,
                            ) * 100,
                          ),
                        );

                      onChange(
                        recipient.id,
                        (current) => ({
                          ...current,
                          tipCents: cents,
                        }),
                      );
                    }}
                  />
                )}
              </Box>

              <Typography
                align="right"
                fontWeight={800}
              >
                Summe:{' '}
                {centsToEUR(
                  recipient.allocations.reduce(
                    (
                      sum,
                      allocation,
                    ) =>
                      sum +
                      allocation.grossCents,
                    0,
                  ) +
                    recipient.tipCents,
                )}
              </Typography>
            </Stack>
          </Paper>
        ),
      )}

      <Button
        variant="outlined"
        startIcon={<AddRoundedIcon />}
        onClick={onAdd}
        sx={{ alignSelf: 'flex-start' }}
      >
        Weiteren Empfänger
        hinzufügen
      </Button>
    </Stack>
  );
}
