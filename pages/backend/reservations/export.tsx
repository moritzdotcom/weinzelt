import BackendHeader from '@/components/backend/header';
import EventSelector from '@/components/eventSelector';
import { Session } from '@/hooks/useSession';
import {
  getDefaultReservationExportFields,
  RESERVATION_EXPORT_FIELD_GROUPS,
  RESERVATION_EXPORT_SORT_OPTIONS,
  ReservationExportFieldKey,
  ReservationExportSortKey,
} from '@/lib/reservationsExportConfig';
import { ApiGetEventsResponse } from '@/pages/api/events';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SelectAllRoundedIcon from '@mui/icons-material/SelectAllRounded';
import axios from 'axios';
import { ReservationPaymentStatus, ReservationType } from '@prisma/client';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import BackendPermissionGuard from '@/components/backend/BackendPermissionGuard';
import { BACKEND_PERMISSIONS } from '@/lib/backend/permissions';

type PreviewResponse = {
  total: number;
  columns: {
    key: ReservationExportFieldKey;
    label: string;
  }[];
  rows: Record<string, string | number>[];
};

export default function BackendReservationExportPage({
  session,
}: {
  session: Session;
}) {
  const router = useRouter();

  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();

  const [q, setQ] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<
    ReservationPaymentStatus | 'all'
  >('PAID');
  const [type, setType] = useState<ReservationType | 'all'>('all');
  const [eventDateId, setEventDateId] = useState('');
  const [timeslot, setTimeslot] = useState('');
  const [sort, setSort] = useState<ReservationExportSortKey>('eventDateAsc');

  const [fields, setFields] = useState<ReservationExportFieldKey[]>(
    getDefaultReservationExportFields(),
  );

  const [preview, setPreview] = useState<PreviewResponse>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady, router]);

  useEffect(() => {
    setEventDateId('');
    setTimeslot('');
  }, [selectedEvent?.id]);

  const sortedEventDates = useMemo(() => {
    if (!selectedEvent) return [];

    return [...selectedEvent.eventDates].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [selectedEvent]);

  const availableTimeslots = useMemo(() => {
    if (!selectedEvent) return [];

    const eventDates = selectedEvent.eventDates ?? [];

    const seatings = eventDates.flatMap((eventDate: any) => {
      return Array.isArray(eventDate.seatings) ? eventDate.seatings : [];
    });

    const filteredSeatings = eventDateId
      ? seatings.filter((seating: any) => seating.eventDateId === eventDateId)
      : seatings;

    return Array.from(
      new Set(
        filteredSeatings
          .map((seating: any) => seating.timeslot)
          .filter(Boolean),
      ),
    ).sort((a, b) => String(a).localeCompare(String(b)));
  }, [selectedEvent, eventDateId]);

  const allFieldKeys = useMemo(
    () =>
      RESERVATION_EXPORT_FIELD_GROUPS.flatMap((group) =>
        group.fields.map((field) => field.key),
      ),
    [],
  );

  const payload = useMemo(
    () => ({
      eventId: selectedEvent?.id,
      q,
      paymentStatus,
      type,
      eventDateId,
      timeslot,
      sort,
      fields,
    }),
    [
      selectedEvent?.id,
      q,
      paymentStatus,
      type,
      eventDateId,
      timeslot,
      sort,
      fields,
    ],
  );

  useEffect(() => {
    if (!selectedEvent || fields.length === 0) {
      setPreview(undefined);
      return;
    }

    let active = true;

    const timeout = window.setTimeout(async () => {
      setPreviewLoading(true);

      try {
        const response = await axios.post<PreviewResponse>(
          '/api/backend/reservations/export',
          {
            ...payload,
            preview: true,
          },
        );

        if (active) {
          setPreview(response.data);
        }
      } finally {
        if (active) {
          setPreviewLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [payload, selectedEvent, fields.length]);

  const toggleField = (key: ReservationExportFieldKey) => {
    setFields((current) =>
      current.includes(key)
        ? current.filter((field) => field !== key)
        : [...current, key],
    );
  };

  const selectAllFields = () => {
    setFields(allFieldKeys);
  };

  const resetFields = () => {
    setFields(getDefaultReservationExportFields());
  };

  const exportReservations = async () => {
    if (!selectedEvent || fields.length === 0) return;

    setExportLoading(true);

    try {
      const response = await axios.post(
        '/api/backend/reservations/export',
        payload,
        {
          responseType: 'blob',
        },
      );

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      const safeEventName = selectedEvent.name
        .replace(/[^a-z0-9äöüß\-_\s]/gi, '')
        .replace(/\s+/g, '_')
        .toLowerCase();

      link.href = url;
      link.download = `reservierungen_${safeEventName}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  };

  const canExport =
    Boolean(selectedEvent) && fields.length > 0 && !exportLoading;

  return (
    <BackendPermissionGuard
      session={session}
      permission={BACKEND_PERMISSIONS.RESERVATION_EXPORT}
      deniedTitle="Kein Zugriff auf Reservierungs Export"
      deniedDescription="Du hast keine Berechtigung, Reservierungen im Backend zu exportieren."
    >
      <Box className="overflow-x-hidden overflow-y-auto min-h-screen bg-gray-50">
        <Box className="max-w-6xl mx-auto px-4 py-10">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr minmax(280px, 380px)',
              },
              gap: 3,
              alignItems: 'center',
            }}
          >
            <BackendHeader
              title="Reservierungen exportieren"
              subtitle="Filtere Reservierungen, wähle Spalten aus und exportiere eine Excel-Datei."
            />

            <EventSelector onChange={setSelectedEvent} />
          </Box>

          <Stack spacing={3} sx={{ mt: 1 }}>
            <Card
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              }}
            >
              <CardContent>
                <StepHeader
                  step="1"
                  title="Filter & Sortierung"
                  description="Lege fest, welche Reservierungen exportiert werden und in welcher Reihenfolge sie erscheinen."
                />

                <Box
                  sx={{
                    mt: 3,
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, 1fr)',
                      xl: 'repeat(3, 1fr)',
                    },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Suche"
                    placeholder="Name, E-Mail, Tischnummer oder ID"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    fullWidth
                  />

                  <TextField
                    select
                    label="Zahlungsstatus"
                    value={paymentStatus}
                    onChange={(e) =>
                      setPaymentStatus(
                        e.target.value as ReservationPaymentStatus | 'all',
                      )
                    }
                    fullWidth
                  >
                    <MenuItem value="all">Alle</MenuItem>
                    <MenuItem value="PAID">Bezahlt</MenuItem>
                    <MenuItem value="PENDING_PAYMENT">Offen</MenuItem>
                    <MenuItem value="DRAFT">Entwurf</MenuItem>
                    <MenuItem value="CANCELED">Storniert</MenuItem>
                  </TextField>

                  <TextField
                    select
                    label="Reservierungsart"
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as ReservationType | 'all')
                    }
                    fullWidth
                  >
                    <MenuItem value="all">Alle</MenuItem>
                    <MenuItem value="VIP">VIP</MenuItem>
                    <MenuItem value="STANDING">Stehtisch</MenuItem>
                  </TextField>

                  <TextField
                    select
                    label="Datum"
                    value={eventDateId}
                    onChange={(e) => {
                      setEventDateId(e.target.value);
                      setTimeslot('');
                    }}
                    disabled={!selectedEvent}
                    fullWidth
                  >
                    <MenuItem value="">Alle Tage</MenuItem>
                    {sortedEventDates.map((eventDate) => (
                      <MenuItem key={eventDate.id} value={eventDate.id}>
                        {eventDate.dow}, {eventDate.date}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Timeslot"
                    value={timeslot}
                    onChange={(e) => setTimeslot(e.target.value)}
                    disabled={!selectedEvent || availableTimeslots.length === 0}
                    fullWidth
                  >
                    <MenuItem value="">Alle Timeslots</MenuItem>
                    {availableTimeslots.map((slot) => (
                      <MenuItem key={slot} value={slot}>
                        {slot}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Sortierung"
                    value={sort}
                    onChange={(e) =>
                      setSort(e.target.value as ReservationExportSortKey)
                    }
                    fullWidth
                  >
                    {RESERVATION_EXPORT_SORT_OPTIONS.map((option) => (
                      <MenuItem key={option.key} value={option.key}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              }}
            >
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <StepHeader
                    step="2"
                    title="Spalten auswählen"
                    description="Wähle aus, welche Felder in der Excel-Datei erscheinen sollen."
                  />

                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outlined"
                      startIcon={<SelectAllRoundedIcon />}
                      onClick={selectAllFields}
                    >
                      Alle
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RestartAltRoundedIcon />}
                      onClick={resetFields}
                    >
                      Standard
                    </Button>
                  </div>
                </div>

                <Divider sx={{ my: 3 }} />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, 1fr)',
                      xl: 'repeat(3, 1fr)',
                    },
                    gap: 2,
                  }}
                >
                  {RESERVATION_EXPORT_FIELD_GROUPS.map((group) => (
                    <Box
                      key={group.title}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        p: 2,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Typography fontWeight={700}>{group.title}</Typography>

                      {group.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {group.description}
                        </Typography>
                      )}

                      <FormGroup sx={{ mt: 1 }}>
                        {group.fields.map((field) => (
                          <FormControlLabel
                            key={field.key}
                            control={
                              <Checkbox
                                checked={fields.includes(field.key)}
                                onChange={() => toggleField(field.key)}
                              />
                            }
                            label={field.label}
                          />
                        ))}
                      </FormGroup>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              }}
            >
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <StepHeader
                    step="3"
                    title="Vorschau & Export"
                    description="Prüfe die ersten 10 Zeilen. Der Export enthält alle passenden Reservierungen."
                  />

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Chip
                      label={
                        previewLoading
                          ? 'Zähle Einträge...'
                          : `${preview?.total ?? 0} Einträge`
                      }
                      color="default"
                    />

                    <Button
                      size="large"
                      variant="contained"
                      startIcon={
                        exportLoading ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <DownloadRoundedIcon />
                        )
                      }
                      disabled={!canExport}
                      onClick={exportReservations}
                      sx={{
                        borderRadius: 999,
                        px: 4,
                        bgcolor: 'black',
                        '&:hover': {
                          bgcolor: 'grey.800',
                        },
                      }}
                    >
                      {exportLoading
                        ? 'Export wird erstellt...'
                        : 'Excel exportieren'}
                    </Button>
                  </Box>
                </div>

                <Divider sx={{ my: 3 }} />

                {!selectedEvent ? (
                  <Alert severity="warning">
                    Bitte wähle oben zuerst ein Event aus.
                  </Alert>
                ) : fields.length === 0 ? (
                  <Alert severity="warning">
                    Bitte wähle mindestens eine Spalte aus.
                  </Alert>
                ) : previewLoading && !preview ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 5 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : preview && preview.rows.length === 0 ? (
                  <Alert severity="info">
                    Für diese Filter wurden keine Reservierungen gefunden.
                  </Alert>
                ) : preview ? (
                  <TableContainer
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                      maxHeight: 520,
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {preview.columns.map((column) => (
                            <TableCell
                              key={column.key}
                              sx={{
                                fontWeight: 800,
                                whiteSpace: 'nowrap',
                                bgcolor: 'grey.100',
                              }}
                            >
                              {column.label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {preview.rows.map((row, index) => (
                          <TableRow key={index} hover>
                            {preview.columns.map((column) => (
                              <TableCell
                                key={column.key}
                                sx={{
                                  whiteSpace: 'nowrap',
                                  maxWidth: 260,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {row[column.key] || ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : null}

                {preview && preview.total > preview.rows.length && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    Angezeigt werden die ersten {preview.rows.length} von{' '}
                    {preview.total} Einträgen. Die Excel enthält alle{' '}
                    {preview.total} Einträge.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>
    </BackendPermissionGuard>
  );
}

function StepHeader({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          bgcolor: 'black',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {step}
      </Box>

      <Box>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}
