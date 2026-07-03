import { useCallback, useEffect, useState } from 'react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  ArrowBackRounded,
  CalendarMonthRounded,
  CancelRounded,
  CheckCircleRounded,
  DescriptionOutlined,
  EmailRounded,
  ErrorOutlineRounded,
  GroupsRounded,
  LocalActivityRounded,
  MailOutlineRounded,
  RefreshRounded,
  ScheduleRounded,
  WineBarRounded,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import type { Session } from '@/hooks/useSession';
import type { ApiGetSpecialEventResponse } from '@/pages/api/backend/specialEvents/[specialEventId]';
import type { ApiSendSpecialEventReminderResponse } from '@/pages/api/backend/specialEvents/[specialEventId]/occurrences/[occurrenceId]/sendReminder';
import { formatSpecialEventCategory } from '@/lib/specialEvents/format';

function formatDate(value: string | Date | null | undefined) {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return '-';

  return new Date(value).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getBookingTypeLabel(
  bookingType: ApiGetSpecialEventResponse['bookingType'],
) {
  switch (bookingType) {
    case 'INTERNAL_REGISTRATION':
      return 'Interne Anmeldung';
    case 'EXTERNAL_LINK':
      return 'Externer Link';
    default:
      return 'Nur Information';
  }
}

export default function BackendSpecialEventPage({
  session,
  id,
}: {
  session: Session;
  id: string;
}) {
  const router = useRouter();

  const [specialEvent, setSpecialEvent] =
    useState<ApiGetSpecialEventResponse>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelRegistrationId, setCancelRegistrationId] = useState<
    string | null
  >(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchSpecialEvent = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const { data } = await axios.get<ApiGetSpecialEventResponse>(
        `/api/backend/specialEvents/${id}`,
      );

      setSpecialEvent(data);
    } catch (error) {
      console.error(error);
      setLoadError('Das WineEvent konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchSpecialEvent();
  }, [fetchSpecialEvent]);

  useEffect(() => {
    if (!router.isReady) return;

    if (session.status === 'unauthenticated') {
      void router.push('/backend/login');
    }
  }, [router, session.status]);

  const handleCancelRegistration = async () => {
    if (!cancelRegistrationId) return;

    try {
      await axios.delete(
        `/api/backend/eventRegistrations/${cancelRegistrationId}`,
      );

      setFeedbackMessage('Die Anmeldung wurde storniert.');
      setCancelRegistrationId(null);

      await fetchSpecialEvent();
    } catch (error) {
      console.error(error);
      setFeedbackMessage('Die Anmeldung konnte nicht storniert werden.');
    }
  };

  if (loading && !specialEvent) {
    return (
      <Box className="flex min-h-screen items-center justify-center">
        <CircularProgress sx={{ color: 'black' }} />
      </Box>
    );
  }

  if (loadError || !specialEvent) {
    return (
      <Box className="mx-auto max-w-5xl px-4 py-16">
        <Alert severity="error">
          {loadError ?? 'Das WineEvent wurde nicht gefunden.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <Link
        href="/backend/specialEvents"
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 transition hover:text-black"
      >
        <ArrowBackRounded fontSize="small" />
        Zurück zu den WineEvents
      </Link>

      <Box className="mt-6 overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
        <Box className="grid md:grid-cols-[260px_1fr]">
          <Box className="relative min-h-56 overflow-hidden bg-stone-100 md:min-h-full">
            {specialEvent.titleImageUrl ? (
              <img
                src={specialEvent.titleImageUrl}
                alt={specialEvent.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Box className="flex h-full min-h-56 items-center justify-center bg-gradient-to-br from-stone-100 via-orange-50 to-rose-100">
                <WineBarRounded sx={{ fontSize: 72, opacity: 0.25 }} />
              </Box>
            )}
          </Box>

          <Box className="p-6 sm:p-8">
            <Box className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <Box>
                <Box className="flex flex-wrap gap-2">
                  <Chip
                    size="small"
                    label={formatSpecialEventCategory(specialEvent.category)}
                    sx={{
                      bgcolor: 'black',
                      color: 'white',
                      fontWeight: 700,
                    }}
                  />

                  <Chip
                    size="small"
                    variant="outlined"
                    label={getBookingTypeLabel(specialEvent.bookingType)}
                  />

                  <Chip
                    size="small"
                    color={specialEvent.isPublished ? 'success' : 'default'}
                    variant="outlined"
                    label={
                      specialEvent.isPublished ? 'Veröffentlicht' : 'Entwurf'
                    }
                  />
                </Box>

                <Typography
                  variant="h4"
                  className="mt-4 font-bold leading-tight"
                >
                  {specialEvent.name}
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1, sm: 3 }}
                  className="mt-4 text-gray-600"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <CalendarMonthRounded fontSize="small" />
                    {specialEvent.occurrences.length === 1
                      ? `${specialEvent.occurrences[0].eventDate.dow}, ${specialEvent.occurrences[0].eventDate.date}`
                      : `${specialEvent.occurrences.length} Termine`}
                  </span>

                  {specialEvent.occurrences.length === 1 && (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <ScheduleRounded fontSize="small" />
                      {specialEvent.occurrences[0].startTime}–
                      {specialEvent.occurrences[0].endTime} Uhr
                    </span>
                  )}
                </Stack>
              </Box>

              <Link
                href={
                  specialEvent.bookingType === 'EXTERNAL_LINK' &&
                  specialEvent.externalUrl
                    ? specialEvent.externalUrl
                    : `/events/${specialEvent.id}`
                }
                target="_blank"
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-black/15 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Öffentliche Seite öffnen
              </Link>
            </Box>

            <Typography className="mt-5 max-w-3xl text-sm leading-relaxed text-gray-600">
              {specialEvent.description}
            </Typography>

            {specialEvent.occurrences.length > 1 && (
              <Box className="mt-5 flex flex-wrap gap-2">
                {specialEvent.occurrences.map((occurrence) => (
                  <Chip
                    key={occurrence.id}
                    variant="outlined"
                    icon={<CalendarMonthRounded />}
                    label={`${occurrence.eventDate.dow}, ${occurrence.eventDate.date} · ${occurrence.startTime}–${occurrence.endTime} Uhr`}
                    sx={{
                      borderRadius: 999,
                      fontWeight: 700,
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Box className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<GroupsRounded />}
          label="Anmeldungen"
          value={specialEvent.stats.registrationCount}
        />

        <StatCard
          icon={<LocalActivityRounded />}
          label="Teilnehmer"
          value={specialEvent.stats.registeredPersonCount}
        />

        <StatCard
          icon={<WineBarRounded />}
          label="Freie Plätze"
          value={
            specialEvent.stats.remainingCapacity === null
              ? 'Unbegrenzt'
              : specialEvent.stats.remainingCapacity
          }
        />

        <StatCard
          icon={<MailOutlineRounded />}
          label="Reminder offen"
          value={specialEvent.stats.pendingReminderCount}
          warning={specialEvent.stats.pendingReminderCount > 0}
        />
      </Box>

      <Box className="mt-8">
        <Typography variant="h5" fontWeight={800}>
          Termine und Teilnehmer
        </Typography>

        <Stack spacing={4} sx={{ mt: 4 }}>
          {specialEvent.occurrences.map((occurrence) => (
            <OccurrenceSection
              key={occurrence.id}
              specialEvent={specialEvent}
              occurrence={occurrence}
              onCancel={(registrationId) =>
                setCancelRegistrationId(registrationId)
              }
              onFinished={fetchSpecialEvent}
            />
          ))}
        </Stack>
      </Box>

      <Dialog
        open={Boolean(cancelRegistrationId)}
        onClose={() => setCancelRegistrationId(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle>Anmeldung stornieren?</DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            Die Anmeldung wird nicht gelöscht, sondern als storniert markiert.
            Dadurch bleibt sie später nachvollziehbar.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCancelRegistrationId(null)}>
            Abbrechen
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleCancelRegistration}
          >
            Stornieren
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedbackMessage)}
        message={feedbackMessage}
        autoHideDuration={6000}
        onClose={() => setFeedbackMessage('')}
      />
    </Box>
  );
}

function StatCard({
  icon,
  label,
  value,
  warning = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <Box className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
      <Box
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
          warning ? 'bg-amber-100 text-amber-700' : 'bg-stone-100'
        }`}
      >
        {icon}
      </Box>

      <Typography className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </Typography>

      <Typography variant="h5" className="mt-1 font-bold">
        {value}
      </Typography>
    </Box>
  );
}

function ReminderStatus({
  registration,
}: {
  registration: ApiGetSpecialEventResponse['occurrences'][number]['registrations'][number];
}) {
  if (registration.reminderSent) {
    return (
      <Chip
        size="small"
        color="success"
        variant="outlined"
        icon={<CheckCircleRounded />}
        label={formatDateTime(registration.reminderSent)}
      />
    );
  }

  if (registration.reminderFailureReason) {
    return (
      <Tooltip title={registration.reminderFailureReason}>
        <Chip
          size="small"
          color="error"
          variant="outlined"
          icon={<ErrorOutlineRounded />}
          label={`Fehler · Versuch ${registration.reminderAttemptCount}`}
        />
      </Tooltip>
    );
  }

  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<EmailRounded />}
      label="Noch nicht verschickt"
    />
  );
}

function ReminderEmailButton({
  specialEventId,
  occurrenceId,
  pendingCount,
  failedCount,
  onFinished,
}: {
  specialEventId: string;
  occurrenceId: string;
  pendingCount: number;
  failedCount: number;
  onFinished: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [processed, setProcessed] = useState(0);
  const [sent, setSent] = useState(0);
  const [failed, setFailed] = useState(0);
  const [initialPendingCount, setInitialPendingCount] = useState(0);

  const progress = initialPendingCount
    ? Math.min(100, (processed / initialPendingCount) * 100)
    : 0;

  const handleOpen = () => {
    setProcessed(0);
    setSent(0);
    setFailed(0);
    setInitialPendingCount(pendingCount);
    setDialogOpen(true);
  };

  const handleSendEmails = async () => {
    setSending(true);

    let shouldContinue = true;
    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let permanentlyFailed = 0;

    try {
      while (shouldContinue) {
        const { data } = await axios.post<ApiSendSpecialEventReminderResponse>(
          `/api/backend/specialEvents/${specialEventId}/occurrences/${occurrenceId}/sendReminder`,
        );

        totalProcessed += data.attempted;
        totalSent += data.sent;
        totalFailed += data.failed;
        permanentlyFailed = data.permanentlyFailed;

        setProcessed(totalProcessed);
        setSent(totalSent);
        setFailed(totalFailed);

        shouldContinue = !data.done;

        /*
         * Sicherheitsnetz gegen eine Endlosschleife:
         * Falls kein Datensatz mehr verarbeitet werden konnte,
         * stoppen wir den Client-Loop.
         */
        if (data.attempted === 0) {
          shouldContinue = false;
        }
      }

      await onFinished();

      if (permanentlyFailed > 0) {
        setFeedbackMessage(
          `${totalSent} Reminder verschickt. ${permanentlyFailed} E-Mail-Adressen konnten nach mehreren Versuchen nicht erreicht werden.`,
        );
      } else {
        setFeedbackMessage(
          `${totalSent} Erinnerungs-E-Mails wurden erfolgreich verschickt.`,
        );
      }
    } catch (error) {
      console.error(error);

      await onFinished();

      setFeedbackMessage(
        'Der Versand wurde unterbrochen. Bereits erfolgreich verschickte Reminder wurden gespeichert. Du kannst den Versand erneut starten.',
      );
    } finally {
      setSending(false);
      setDialogOpen(false);
    }
  };

  const handleResetFailed = async () => {
    setResetting(true);

    try {
      const { data } = await axios.post<{ reset: number }>(
        `/api/backend/specialEvents/${specialEventId}/occurrences/${occurrenceId}/resetFailedReminders`,
      );

      await onFinished();

      setFeedbackMessage(
        `${data.reset} fehlgeschlagene Reminder wurden erneut freigegeben.`,
      );
    } catch (error) {
      console.error(error);

      setFeedbackMessage(
        'Die fehlgeschlagenen Reminder konnten nicht zurückgesetzt werden.',
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        {failedCount > 0 && (
          <Button
            variant="outlined"
            color="error"
            disabled={resetting || sending}
            startIcon={
              resetting ? <CircularProgress size={16} /> : <RefreshRounded />
            }
            onClick={handleResetFailed}
            sx={{ borderRadius: 999 }}
          >
            Fehlgeschlagene erneut freigeben
          </Button>
        )}

        <Button
          variant="contained"
          disabled={sending || pendingCount === 0}
          startIcon={<MailOutlineRounded />}
          onClick={handleOpen}
          sx={{ borderRadius: 999 }}
        >
          {pendingCount === 0
            ? 'Alle Reminder verschickt'
            : `${pendingCount} Reminder senden`}
        </Button>
      </Stack>

      <Dialog
        open={dialogOpen}
        onClose={sending ? undefined : () => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle>Reminder verschicken?</DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            Es werden Reminder an {initialPendingCount}{' '}
            {initialPendingCount === 1
              ? 'offene Anmeldung'
              : 'offene Anmeldungen'}{' '}
            verschickt. Der Versand erfolgt automatisch in kleinen Batches.
          </Typography>

          {sending && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 999 }}
              />

              <Box className="mt-2 flex justify-between gap-3 text-sm text-gray-500">
                <span>
                  {processed} von {initialPendingCount} verarbeitet
                </span>

                <span>
                  {sent} erfolgreich
                  {failed > 0 && ` · ${failed} fehlgeschlagen`}
                </span>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button disabled={sending} onClick={() => setDialogOpen(false)}>
            Abbrechen
          </Button>

          <Button
            variant="contained"
            disabled={sending}
            startIcon={sending ? <CircularProgress size={18} /> : undefined}
            onClick={handleSendEmails}
          >
            {sending ? 'Versand läuft …' : 'Jetzt verschicken'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedbackMessage)}
        message={feedbackMessage}
        autoHideDuration={8000}
        onClose={() => setFeedbackMessage('')}
      />
    </>
  );
}

function OccurrenceSection({
  specialEvent,
  occurrence,
  onCancel,
  onFinished,
}: {
  specialEvent: ApiGetSpecialEventResponse;
  occurrence: ApiGetSpecialEventResponse['occurrences'][number];
  onCancel: (registrationId: string) => void;
  onFinished: () => Promise<void>;
}) {
  const activeRegistrations = occurrence.registrations.filter(
    (registration) => registration.status === 'REGISTERED',
  );

  const canceledRegistrations = occurrence.registrations.filter(
    (registration) => registration.status === 'CANCELED',
  );

  return (
    <Box className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
      <Box className="flex flex-col gap-4 border-b border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <Box>
          <Typography variant="h6" fontWeight={900}>
            {occurrence.eventDate.dow}, {occurrence.eventDate.date}
          </Typography>

          <Typography className="mt-1 text-sm text-gray-500">
            {occurrence.startTime} - {occurrence.endTime} Uhr ·{' '}
            {occurrence.stats.registeredPersonCount} Teilnehmer
            {occurrence.stats.remainingCapacity !== null &&
              ` · ${occurrence.stats.remainingCapacity} Plätze frei`}
          </Typography>
        </Box>

        {specialEvent.bookingType === 'INTERNAL_REGISTRATION' && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              component="a"
              href={`/api/backend/specialEvents/${specialEvent.id}/occurrences/${occurrence.id}/guestListPdf`}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              startIcon={<DescriptionOutlined />}
              sx={{
                bgcolor: 'grey.900',
                color: 'white',
                borderRadius: 999,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                '& .MuiButton-startIcon': {
                  mr: 1,
                },
                '&:hover': {
                  bgcolor: 'black',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 160ms ease',
              }}
            >
              Gästeliste
            </Button>
            <ReminderEmailButton
              specialEventId={specialEvent.id}
              occurrenceId={occurrence.id}
              pendingCount={occurrence.stats.pendingReminderCount}
              failedCount={occurrence.stats.failedReminderCount}
              onFinished={onFinished}
            />
          </Stack>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Name</strong>
              </TableCell>
              <TableCell>
                <strong>Kontakt</strong>
              </TableCell>
              <TableCell>
                <strong>Personen</strong>
              </TableCell>
              <TableCell>
                <strong>Registriert am</strong>
              </TableCell>
              <TableCell>
                <strong>Reminder</strong>
              </TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>

          <TableBody>
            {activeRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box className="py-8 text-center">
                    <GroupsRounded sx={{ fontSize: 40, opacity: 0.25 }} />

                    <Typography className="mt-2 font-semibold">
                      Noch keine Anmeldungen für diesen Termin
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              activeRegistrations.map((registration) => (
                <TableRow key={registration.id} hover>
                  <TableCell sx={{ minWidth: 170 }}>
                    <Typography className="font-semibold">
                      {registration.name}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ minWidth: 220 }}>
                    <Typography className="text-sm">
                      {registration.email}
                    </Typography>

                    {registration.phone && (
                      <Typography className="mt-0.5 text-xs text-gray-500">
                        {registration.phone}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>{registration.personCount}</TableCell>

                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {formatDate(registration.createdAt)}
                  </TableCell>

                  <TableCell sx={{ minWidth: 190 }}>
                    <ReminderStatus registration={registration} />
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Anmeldung stornieren">
                      <IconButton
                        color="error"
                        onClick={() => onCancel(registration.id)}
                      >
                        <CancelRounded />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {canceledRegistrations.length > 0 && (
        <Box className="border-t border-black/10 bg-stone-50 p-5">
          <Typography variant="subtitle2" fontWeight={800}>
            Stornierte Anmeldungen
          </Typography>

          <Box className="mt-3 grid gap-2">
            {canceledRegistrations.map((registration) => (
              <Box
                key={registration.id}
                className="flex flex-col gap-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <strong>{registration.name}</strong> · {registration.email} ·{' '}
                  {registration.personCount}{' '}
                  {registration.personCount === 1 ? 'Person' : 'Personen'}
                </span>

                <span className="text-xs text-gray-500">
                  Storniert am {formatDate(registration.canceledAt)}
                </span>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.query.id;

  if (typeof id !== 'string') {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      id,
    },
  };
};
