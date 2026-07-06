import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  AddRounded,
  AttachFileRounded,
  EditRounded,
  GroupsRounded,
  LocalActivityRounded,
  OpenInNewRounded,
  SaveRounded,
  WineBarRounded,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EventSelector from '@/components/eventSelector';
import { compareEventDates } from '@/lib/eventDates';
import type { Session } from '@/hooks/useSession';
import type { ApiGetEventsResponse } from '../../api/events';
import type { PublicSpecialEvent } from '@/lib/specialEvents';
import { SpecialEventCard } from '@/components/specialEventCard';
import BackendHeader from '@/components/backend/header';
import {
  formatSpecialEventCategory,
  formatSpecialEventPrice,
} from '@/lib/specialEvents/format';
import BackendPermissionGuard from '@/components/backend/BackendPermissionGuard';
import { BACKEND_PERMISSIONS } from '@/lib/backend/permissions';

type BackendSpecialEventOccurrence = {
  id: string;
  eventDate: {
    id: string;
    date: string;
    dow?: string | null;
  };
  startTime: string;
  endTime: string;
  capacity: number | null;
  stats?: {
    registrationCount: number;
    registeredPersonCount: number;
    remainingCapacity: number | null;
  };
};

type BackendSpecialEventListItem = {
  id: string;
  name: string;
  description: string;
  category: PublicSpecialEvent['category'];
  badge: string | null;
  titleImageUrl: string | null;
  priceCents: number | null;
  priceLabel: string | null;
  ctaLabel: string;
  bookingType: PublicSpecialEvent['bookingType'];
  externalUrl: string | null;
  maxPersonsPerRegistration: number;
  sortOrder: number;
  isPublished: boolean;
  attachmentUrl: string | null;
  attachmentLabel: string | null;
  occurrences: BackendSpecialEventOccurrence[];
  stats?: {
    registrationCount: number;
    registeredPersonCount: number;
    remainingCapacity: number | null;
  };
};

type OccurrenceFormState = {
  id?: string;
  eventDateId: string;
  startTime: string;
  endTime: string;
  capacity: string;
};

type EditFormState = {
  name: string;
  description: string;
  category: PublicSpecialEvent['category'];
  badge: string;
  ctaLabel: string;
  bookingType: PublicSpecialEvent['bookingType'];
  externalUrl: string;
  price: string;
  priceLabel: string;
  maxPersonsPerRegistration: string;
  isPublished: boolean;
  attachmentLabel: string;
  occurrences: OccurrenceFormState[];
};

function getBookingTypeLabel(bookingType: PublicSpecialEvent['bookingType']) {
  switch (bookingType) {
    case 'INTERNAL_REGISTRATION':
      return 'Interne Anmeldung';
    case 'EXTERNAL_LINK':
      return 'Externer Link';
    default:
      return 'Nur Information';
  }
}

function getBookingTypeColor(
  bookingType: PublicSpecialEvent['bookingType'],
): 'default' | 'primary' | 'secondary' {
  switch (bookingType) {
    case 'INTERNAL_REGISTRATION':
      return 'primary';
    case 'EXTERNAL_LINK':
      return 'secondary';
    default:
      return 'default';
  }
}

function toCents(value: string) {
  if (!value.trim()) return '';

  const parsed = Number(value.replace(',', '.'));

  if (!Number.isFinite(parsed)) return '';

  return String(Math.round(parsed * 100));
}

function getOccurrenceRegisteredPersonCount(
  occurrence: BackendSpecialEventOccurrence,
) {
  return occurrence.stats?.registeredPersonCount ?? 0;
}

function getEventRegisteredPersonCount(event: BackendSpecialEventListItem) {
  if (event.stats) return event.stats.registeredPersonCount;

  return event.occurrences.reduce(
    (sum, occurrence) => sum + getOccurrenceRegisteredPersonCount(occurrence),
    0,
  );
}

function getEventRemainingCapacity(event: BackendSpecialEventListItem) {
  if (event.stats) return event.stats.remainingCapacity;

  const hasUnlimitedOccurrence = event.occurrences.some(
    (occurrence) => occurrence.capacity === null,
  );

  if (hasUnlimitedOccurrence) return null;

  return event.occurrences.reduce((sum, occurrence) => {
    const remaining =
      occurrence.stats?.remainingCapacity ??
      Math.max(
        0,
        (occurrence.capacity ?? 0) -
          getOccurrenceRegisteredPersonCount(occurrence),
      );

    return sum + remaining;
  }, 0);
}

function getFirstOccurrence(event: BackendSpecialEventListItem) {
  return event.occurrences[0] ?? null;
}

function getOccurrenceLabel(occurrence: BackendSpecialEventOccurrence) {
  const dateLabel = occurrence.eventDate.dow
    ? `${occurrence.eventDate.dow}, ${occurrence.eventDate.date}`
    : occurrence.eventDate.date;

  return `${dateLabel} · ${occurrence.startTime}–${occurrence.endTime} Uhr`;
}

function getShortOccurrencesLabel(event: BackendSpecialEventListItem) {
  if (event.occurrences.length === 0) return 'Kein Termin hinterlegt';

  if (event.occurrences.length === 1) {
    return getOccurrenceLabel(event.occurrences[0]);
  }

  return `${event.occurrences.length} Termine hinterlegt`;
}

function sortSpecialEvents(
  events: BackendSpecialEventListItem[],
): BackendSpecialEventListItem[] {
  return [...events].sort((a, b) => {
    const firstA = getFirstOccurrence(a);
    const firstB = getFirstOccurrence(b);

    if (firstA && firstB) {
      const dateComparison = compareEventDates(
        firstA.eventDate.date,
        firstB.eventDate.date,
      );

      if (dateComparison !== 0) return dateComparison;

      const timeComparison = firstA.startTime.localeCompare(firstB.startTime);
      if (timeComparison !== 0) return timeComparison;
    }

    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.name.localeCompare(b.name);
  });
}

function getInitialEditForm(
  specialEvent: BackendSpecialEventListItem,
): EditFormState {
  return {
    name: specialEvent.name,
    description: specialEvent.description,
    category: specialEvent.category,
    badge: specialEvent.badge || '',
    ctaLabel: specialEvent.ctaLabel,
    bookingType: specialEvent.bookingType,
    externalUrl: specialEvent.externalUrl || '',
    price: specialEvent.priceCents
      ? String(specialEvent.priceCents / 100).replace('.', ',')
      : '',
    priceLabel: specialEvent.priceLabel || '',
    maxPersonsPerRegistration: String(specialEvent.maxPersonsPerRegistration),
    isPublished: specialEvent.isPublished,
    attachmentLabel: specialEvent.attachmentLabel || '',
    occurrences: specialEvent.occurrences.map((occurrence) => ({
      id: occurrence.id,
      eventDateId: occurrence.eventDate.id,
      startTime: occurrence.startTime,
      endTime: occurrence.endTime,
      capacity: occurrence.capacity === null ? '' : String(occurrence.capacity),
    })),
  };
}

function buildPreviewEvent(params: {
  form: EditFormState;
  specialEvent: BackendSpecialEventListItem;
  eventDates: ApiGetEventsResponse[number]['eventDates'];
  titleImagePreview: string | null;
  removeTitleImage: boolean;
  removeAttachment: boolean;
}): PublicSpecialEvent {
  const {
    form,
    specialEvent,
    eventDates,
    titleImagePreview,
    removeTitleImage,
    removeAttachment,
  } = params;

  const occurrences = form.occurrences
    .map((occurrence) => {
      const eventDate = eventDates.find(
        (date) => date.id === occurrence.eventDateId,
      );

      if (!eventDate) return null;

      const capacity = occurrence.capacity ? Number(occurrence.capacity) : null;

      return {
        id: occurrence.id ?? occurrence.eventDateId,
        eventDate: {
          id: eventDate.id,
          date: eventDate.date,
          dow: eventDate.dow,
        },
        startTime: occurrence.startTime,
        endTime: occurrence.endTime,
        capacity,
        remainingCapacity: capacity,
        isSoldOut: false,
      };
    })
    .filter(Boolean) as PublicSpecialEvent['occurrences'];

  const firstOccurrence = occurrences[0];

  return {
    id: specialEvent.id,
    name: form.name || 'Name des WineEvents',
    description:
      form.description ||
      'Beschreibe hier kurz, was die Gäste bei diesem WineEvent erwartet.',
    category: form.category,
    badge: form.badge || null,
    titleImageUrl: removeTitleImage ? null : titleImagePreview,
    priceCents: toCents(form.price) ? Number(toCents(form.price)) : null,
    priceLabel: form.priceLabel || null,
    ctaLabel: form.ctaLabel || 'Jetzt anmelden',
    bookingType: form.bookingType,
    externalUrl: form.externalUrl || null,
    maxPersonsPerRegistration: Number(form.maxPersonsPerRegistration) || 10,
    attachmentUrl: removeAttachment ? null : specialEvent.attachmentUrl,
    attachmentLabel: form.attachmentLabel || null,
    occurrences,
    eventDate: firstOccurrence?.eventDate ?? {
      id: 'preview-date',
      date: 'Noch kein Termin',
      dow: null,
    },
    startTime: firstOccurrence?.startTime ?? '11:00',
    endTime: firstOccurrence?.endTime ?? '14:00',
    remainingCapacity: occurrences.some(
      (occurrence) => occurrence.remainingCapacity === null,
    )
      ? null
      : occurrences.reduce(
          (sum, occurrence) => sum + (occurrence.remainingCapacity ?? 0),
          0,
        ),
    isSoldOut:
      occurrences.length > 0 &&
      occurrences.every((occurrence) => occurrence.isSoldOut),
  };
}

export default function BackendSpecialEventsPage({
  session,
}: {
  session: Session;
}) {
  const router = useRouter();

  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();
  const [specialEvents, setSpecialEvents] = useState<
    BackendSpecialEventListItem[]
  >([]);
  const [selectedSpecialEvent, setSelectedSpecialEvent] =
    useState<BackendSpecialEventListItem>();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSpecialEvents = async () => {
    if (!selectedEvent?.id) {
      setSpecialEvents([]);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const { data } = await axios.get<BackendSpecialEventListItem[]>(
        '/api/backend/specialEvents',
        {
          params: {
            eventId: selectedEvent.id,
          },
        },
      );

      setSpecialEvents(sortSpecialEvents(data));
    } catch (error) {
      console.error(error);
      setLoadError('Die WineEvents konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSpecialEvents();
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (!router.isReady) return;

    if (session.status === 'unauthenticated') {
      void router.push('/backend/login');
    }
  }, [session.status, router.isReady, router]);

  return (
    <BackendPermissionGuard
      session={session}
      permission={BACKEND_PERMISSIONS.SPECIAL_EVENTS}
      deniedTitle="Kein Zugriff auf Special Events"
      deniedDescription="Du hast keine Berechtigung, Special Events im Backend zu verwalten."
    >
      <Box className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <BackendHeader
          title="WineEvents verwalten"
          subtitle="Verwalte WineWalks, Tastings, Brunches und weitere Veranstaltungen inklusive Terminen, Buchungslogik, Bildern und Teilnehmerzahlen."
          action={
            <Link
              href="/backend/specialEvents/new"
              className="inline-flex items-center justify-center gap-1 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              <AddRounded fontSize="small" />
              Neues WineEvent
            </Link>
          }
        />

        <Box className="my-7 max-w-md">
          <EventSelector onChange={setSelectedEvent} />
        </Box>

        {!selectedEvent && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Wähle zuerst das Weinzelt-Event aus, für das du die WineEvents
            verwalten möchtest.
          </Alert>
        )}

        {loadError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        )}

        {loading ? (
          <Grid container spacing={3}>
            {[0, 1, 2, 3].map((item) => (
              <Grid key={item} size={{ xs: 12, md: 6 }}>
                <Skeleton
                  variant="rounded"
                  height={310}
                  sx={{ borderRadius: 4 }}
                />
              </Grid>
            ))}
          </Grid>
        ) : selectedEvent && specialEvents.length === 0 ? (
          <Box className="rounded-[2rem] border border-dashed border-black/20 bg-stone-50 px-6 py-16 text-center">
            <WineBarRounded sx={{ fontSize: 56, opacity: 0.35 }} />

            <Typography variant="h6" className="mt-3 font-bold">
              Noch keine WineEvents angelegt
            </Typography>

            <Typography className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
              Für dieses Weinzelt-Event existieren noch keine WineWalks,
              Tastings, Brunches oder weiteren Veranstaltungen.
            </Typography>

            <Link
              href="/backend/specialEvents/new"
              className="mt-6 inline-flex items-center justify-center gap-1 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <AddRounded fontSize="small" />
              Erstes WineEvent erstellen
            </Link>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {specialEvents.map((event) => (
              <Grid key={event.id} size={{ xs: 12, lg: 6 }}>
                <AdminSpecialEventCard
                  event={event}
                  onEdit={() => setSelectedSpecialEvent(event)}
                />
              </Grid>
            ))}
          </Grid>
        )}

        <EditSpecialEventDialog
          open={Boolean(selectedSpecialEvent)}
          specialEvent={selectedSpecialEvent}
          eventDates={selectedEvent?.eventDates ?? []}
          onClose={() => setSelectedSpecialEvent(undefined)}
          onSuccess={() => {
            setSelectedSpecialEvent(undefined);
            void fetchSpecialEvents();
          }}
        />
      </Box>
    </BackendPermissionGuard>
  );
}

function AdminSpecialEventCard({
  event,
  onEdit,
}: {
  event: BackendSpecialEventListItem;
  onEdit: () => void;
}) {
  const price = formatSpecialEventPrice(event);
  const registeredPersonCount = getEventRegisteredPersonCount(event);
  const remainingCapacity = getEventRemainingCapacity(event);

  return (
    <Box className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Box className="grid min-h-48 grid-cols-1 sm:grid-cols-[180px_1fr]">
        <Box className="relative min-h-44 overflow-hidden bg-stone-100 sm:min-h-full">
          {event.titleImageUrl ? (
            <img
              src={event.titleImageUrl}
              alt={event.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Box className="flex h-full min-h-44 items-center justify-center bg-gradient-to-br from-stone-100 via-orange-50 to-rose-100">
              <WineBarRounded sx={{ fontSize: 54, opacity: 0.25 }} />
            </Box>
          )}

          <Box className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Chip
              size="small"
              label={formatSpecialEventCategory(event.category)}
              sx={{
                bgcolor: 'black',
                color: 'white',
                fontWeight: 700,
                fontSize: 11,
              }}
            />

            {!event.isPublished && (
              <Chip
                size="small"
                label="Entwurf"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.9)',
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            )}
          </Box>
        </Box>

        <Box className="flex min-w-0 flex-col p-5">
          <Box className="flex items-start justify-between gap-3">
            <Box className="min-w-0">
              <Typography variant="h6" className="font-bold leading-tight">
                {event.name}
              </Typography>

              <Typography className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {getShortOccurrencesLabel(event)}
              </Typography>
            </Box>

            {registeredPersonCount > 0 && (
              <Chip
                size="small"
                icon={<GroupsRounded sx={{ fontSize: '16px !important' }} />}
                label={registeredPersonCount}
                color="error"
                variant="outlined"
                sx={{ fontWeight: 700, pl: 0.5 }}
              />
            )}
          </Box>

          <Typography className="mt-4 line-clamp-3 text-sm leading-relaxed text-gray-600">
            {event.description}
          </Typography>

          {event.occurrences.length > 1 && (
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 3 }}
            >
              {event.occurrences.slice(0, 4).map((occurrence) => (
                <Chip
                  key={occurrence.id}
                  size="small"
                  variant="outlined"
                  label={
                    occurrence.eventDate.dow
                      ? `${occurrence.eventDate.dow}, ${occurrence.eventDate.date}`
                      : occurrence.eventDate.date
                  }
                  sx={{ borderRadius: 999, fontWeight: 700 }}
                />
              ))}

              {event.occurrences.length > 4 && (
                <Chip
                  size="small"
                  label={`+${event.occurrences.length - 4} weitere`}
                  sx={{ borderRadius: 999, fontWeight: 700 }}
                />
              )}
            </Stack>
          )}

          <Box className="mt-4 flex flex-wrap gap-1.5">
            <Chip
              size="small"
              label={getBookingTypeLabel(event.bookingType)}
              color={getBookingTypeColor(event.bookingType)}
              variant="outlined"
            />

            {price && <Chip size="small" label={price} variant="outlined" />}

            {event.bookingType === 'INTERNAL_REGISTRATION' && (
              <Chip
                size="small"
                label={
                  remainingCapacity === null
                    ? 'Unbegrenzte Plätze'
                    : `${remainingCapacity} Plätze frei`
                }
                variant="outlined"
              />
            )}

            {event.attachmentUrl && (
              <Chip size="small" label="Anhang" variant="outlined" />
            )}
          </Box>
        </Box>
      </Box>

      <Divider />

      <Box className="flex flex-col gap-2 p-4 sm:flex-row sm:flex-wrap">
        <Button
          variant="contained"
          startIcon={<EditRounded />}
          onClick={onEdit}
          sx={{ borderRadius: 999 }}
        >
          Bearbeiten
        </Button>

        {event.bookingType === 'INTERNAL_REGISTRATION' && (
          <Link
            href={`/backend/specialEvents/${event.id}`}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-sky-600 px-4 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-50"
          >
            <GroupsRounded fontSize="small" />
            Teilnehmer
          </Link>
        )}

        <Link
          href={
            event.bookingType === 'EXTERNAL_LINK' && event.externalUrl
              ? event.externalUrl
              : `/events/${event.id}`
          }
          target="_blank"
          className="inline-flex items-center justify-center gap-1 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <OpenInNewRounded fontSize="small" />
          Öffnen
        </Link>
      </Box>
    </Box>
  );
}

function EditSpecialEventDialog({
  open,
  specialEvent,
  eventDates,
  onClose,
  onSuccess,
}: {
  open: boolean;
  specialEvent: BackendSpecialEventListItem | undefined;
  eventDates: ApiGetEventsResponse[number]['eventDates'];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<EditFormState | null>(null);
  const [titleImage, setTitleImage] = useState<File | null>(null);
  const [titleImagePreview, setTitleImagePreview] = useState<string | null>(
    null,
  );
  const [removeTitleImage, setRemoveTitleImage] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!specialEvent) return;

    setForm(getInitialEditForm(specialEvent));
    setTitleImage(null);
    setTitleImagePreview(specialEvent.titleImageUrl);
    setRemoveTitleImage(false);
    setAttachment(null);
    setRemoveAttachment(false);
    setSaveError(null);
  }, [specialEvent]);

  useEffect(() => {
    if (!titleImage) return;

    const objectUrl = URL.createObjectURL(titleImage);
    setTitleImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [titleImage]);

  const updateForm = <Key extends keyof EditFormState>(
    key: Key,
    value: EditFormState[Key],
  ) => {
    setForm((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current,
    );
  };

  const updateOccurrences = (occurrences: OccurrenceFormState[]) => {
    updateForm('occurrences', occurrences);
  };

  const previewEvent = useMemo<PublicSpecialEvent | null>(() => {
    if (!form || !specialEvent) return null;

    return buildPreviewEvent({
      form,
      specialEvent,
      eventDates,
      titleImagePreview,
      removeTitleImage,
      removeAttachment,
    });
  }, [
    form,
    specialEvent,
    eventDates,
    titleImagePreview,
    removeTitleImage,
    removeAttachment,
  ]);

  if (!form || !specialEvent || !previewEvent) return null;

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setTitleImage(file);
    setRemoveTitleImage(false);
  };

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setAttachment(file);
    setRemoveAttachment(false);

    if (!form.attachmentLabel.trim()) {
      updateForm(
        'attachmentLabel',
        file.type === 'application/pdf'
          ? 'PDF mit weiteren Informationen'
          : 'Anhang ansehen',
      );
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (form.occurrences.length === 0) {
      setSaveError('Bitte wähle mindestens einen Termin aus.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const body = new FormData();

      body.append('name', form.name);
      body.append('description', form.description);
      body.append('category', form.category);
      body.append('badge', form.badge);
      body.append('ctaLabel', form.ctaLabel);
      body.append('bookingType', form.bookingType);
      body.append('externalUrl', form.externalUrl);
      body.append('priceCents', toCents(form.price));
      body.append('priceLabel', form.priceLabel);
      body.append('maxPersonsPerRegistration', form.maxPersonsPerRegistration);
      body.append('isPublished', String(form.isPublished));
      body.append('removeTitleImage', String(removeTitleImage));
      body.append('attachmentLabel', form.attachmentLabel);
      body.append('removeAttachment', String(removeAttachment));

      body.append(
        'occurrences',
        JSON.stringify(
          form.occurrences.map((occurrence, index) => ({
            ...occurrence,
            sortOrder: index,
          })),
        ),
      );

      if (titleImage) {
        body.append('titleImage', titleImage);
      }

      if (attachment) {
        body.append('attachment', attachment);
      }

      await axios.put(
        `/api/backend/specialEvents/${specialEvent.id}/update`,
        body,
      );

      onSuccess();
    } catch (error) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        setSaveError(
          error.response?.data?.error ||
            'Das WineEvent konnte nicht gespeichert werden.',
        );
      } else {
        setSaveError('Das WineEvent konnte nicht gespeichert werden.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        sx: {
          borderRadius: 4,
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ px: { xs: 3, md: 4 }, pt: 3 }}>
          <Typography variant="overline" color="text.secondary">
            WineEvent bearbeiten
          </Typography>

          <Typography variant="h5" fontWeight={800}>
            {specialEvent.name}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 3, md: 4 }, py: 2 }}>
          {saveError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {saveError}
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gap: 4,
              alignItems: 'start',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(0, 1fr) 360px',
              },
            }}
          >
            <Stack spacing={2.5}>
              <Typography variant="subtitle1" fontWeight={800}>
                Inhalte
              </Typography>

              <TextField
                required
                label="Name"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
              />

              <TextField
                required
                multiline
                minRows={4}
                label="Beschreibung"
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
              />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ sm: 'center' }}
              >
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<LocalActivityRounded />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Neues Titelbild wählen
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                  />
                </Button>

                {(specialEvent.titleImageUrl || titleImage) && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={removeTitleImage}
                        onChange={(event) =>
                          setRemoveTitleImage(event.target.checked)
                        }
                      />
                    }
                    label="Bild entfernen"
                  />
                )}
              </Stack>

              {titleImage && (
                <Typography variant="caption" color="text.secondary">
                  Neues Bild: {titleImage.name}
                </Typography>
              )}

              <Divider />

              <Typography variant="subtitle1" fontWeight={800}>
                Termine
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Wähle einen oder mehrere Tage aus. Uhrzeit und Kapazität können
                pro Tag unterschiedlich sein.
              </Typography>

              <SpecialEventOccurrencesEditor
                eventDates={eventDates}
                bookingType={form.bookingType}
                occurrences={form.occurrences}
                onChange={updateOccurrences}
              />

              <Divider />

              <Typography variant="subtitle1" fontWeight={800}>
                Darstellung
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Kategorie</InputLabel>
                <Select
                  label="Kategorie"
                  value={form.category}
                  onChange={(event) =>
                    updateForm(
                      'category',
                      event.target.value as EditFormState['category'],
                    )
                  }
                >
                  <MenuItem value="WINE_WALK">WineWalk</MenuItem>
                  <MenuItem value="WINE_TASTING">WineTasting</MenuItem>
                  <MenuItem value="OTHER">Sonstiges WineEvent</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Zusätzliches Badge"
                placeholder="z. B. Limitiert oder Special"
                value={form.badge}
                onChange={(event) => updateForm('badge', event.target.value)}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Preis in Euro"
                  placeholder="29,90"
                  value={form.price}
                  onChange={(event) => updateForm('price', event.target.value)}
                />

                <TextField
                  fullWidth
                  label="Alternatives Preislabel"
                  placeholder="Kostenlos oder inkl. 5 Weine"
                  value={form.priceLabel}
                  onChange={(event) =>
                    updateForm('priceLabel', event.target.value)
                  }
                />
              </Stack>

              <Divider />

              <Typography variant="subtitle1" fontWeight={800}>
                Buchung
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Buchungsart</InputLabel>
                <Select
                  label="Buchungsart"
                  value={form.bookingType}
                  onChange={(event) =>
                    updateForm(
                      'bookingType',
                      event.target.value as EditFormState['bookingType'],
                    )
                  }
                >
                  <MenuItem value="INTERNAL_REGISTRATION">
                    Registrierung über Weinzelt
                  </MenuItem>
                  <MenuItem value="EXTERNAL_LINK">
                    Externe Reservierungsplattform
                  </MenuItem>
                  <MenuItem value="NONE">Keine Registrierung</MenuItem>
                </Select>
              </FormControl>

              {form.bookingType !== 'NONE' && (
                <TextField
                  required
                  label="CTA"
                  placeholder="Jetzt anmelden"
                  value={form.ctaLabel}
                  onChange={(event) =>
                    updateForm('ctaLabel', event.target.value)
                  }
                />
              )}

              {form.bookingType === 'EXTERNAL_LINK' && (
                <TextField
                  required
                  type="url"
                  label="Externer Reservierungslink"
                  placeholder="https://..."
                  value={form.externalUrl}
                  onChange={(event) =>
                    updateForm('externalUrl', event.target.value)
                  }
                />
              )}

              {form.bookingType === 'INTERNAL_REGISTRATION' && (
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Max. Personen pro Anmeldung"
                  inputProps={{ min: 1, max: 50 }}
                  value={form.maxPersonsPerRegistration}
                  onChange={(event) =>
                    updateForm('maxPersonsPerRegistration', event.target.value)
                  }
                />
              )}

              <Divider />

              <Typography variant="subtitle1" fontWeight={800}>
                Anhang
              </Typography>

              <TextField
                label="Anhang-Label"
                placeholder="z. B. Speisekarte ansehen"
                value={form.attachmentLabel}
                onChange={(event) =>
                  updateForm('attachmentLabel', event.target.value)
                }
                helperText="Optional. Wird auf der Detailseite als Titel angezeigt."
              />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ sm: 'center' }}
              >
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<AttachFileRounded />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Neuen Anhang wählen
                  <input
                    hidden
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={handleAttachmentChange}
                  />
                </Button>

                {(specialEvent.attachmentUrl || attachment) && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={removeAttachment}
                        onChange={(event) =>
                          setRemoveAttachment(event.target.checked)
                        }
                      />
                    }
                    label="Anhang entfernen"
                  />
                )}
              </Stack>

              {specialEvent.attachmentUrl &&
                !attachment &&
                !removeAttachment && (
                  <Button
                    component="a"
                    href={specialEvent.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="text"
                    endIcon={<OpenInNewRounded />}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Aktuellen Anhang öffnen
                  </Button>
                )}

              {attachment && (
                <Typography variant="caption" color="text.secondary">
                  Neuer Anhang: {attachment.name}
                </Typography>
              )}

              <Divider />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isPublished}
                    onChange={(event) =>
                      updateForm('isPublished', event.target.checked)
                    }
                  />
                }
                label="Auf der Website veröffentlichen"
              />
            </Stack>

            <Box sx={{ position: { md: 'sticky' }, top: { md: 16 } }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: 'block', mb: 1 }}
              >
                Live-Preview
              </Typography>

              <SpecialEventCard event={previewEvent} preview />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 3, md: 4 }, py: 3 }}>
          <Button onClick={onClose} disabled={saving}>
            Abbrechen
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={saving || !form.name.trim()}
            startIcon={
              saving ? <CircularProgress size={18} /> : <SaveRounded />
            }
          >
            Speichern
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function SpecialEventOccurrencesEditor({
  eventDates,
  bookingType,
  occurrences,
  onChange,
}: {
  eventDates: ApiGetEventsResponse[number]['eventDates'];
  bookingType: PublicSpecialEvent['bookingType'];
  occurrences: OccurrenceFormState[];
  onChange: (occurrences: OccurrenceFormState[]) => void;
}) {
  const sortedEventDates = [...eventDates].sort((a, b) =>
    compareEventDates(a.date, b.date),
  );

  const updateOccurrence = (
    eventDateId: string,
    patch: Partial<OccurrenceFormState>,
  ) => {
    onChange(
      occurrences.map((occurrence) =>
        occurrence.eventDateId === eventDateId
          ? {
              ...occurrence,
              ...patch,
            }
          : occurrence,
      ),
    );
  };

  const toggleOccurrence = (
    eventDate: ApiGetEventsResponse[number]['eventDates'][number],
    checked: boolean,
  ) => {
    if (checked) {
      onChange([
        ...occurrences,
        {
          eventDateId: eventDate.id,
          startTime: '11:00',
          endTime: '14:00',
          capacity: '',
        },
      ]);
      return;
    }

    onChange(
      occurrences.filter(
        (occurrence) => occurrence.eventDateId !== eventDate.id,
      ),
    );
  };

  if (sortedEventDates.length === 0) {
    return (
      <Alert severity="warning">
        Für das ausgewählte Weinzelt-Event sind keine Veranstaltungstage
        vorhanden.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      {sortedEventDates.map((eventDate) => {
        const occurrence = occurrences.find(
          (item) => item.eventDateId === eventDate.id,
        );

        const checked = Boolean(occurrence);

        return (
          <Box
            key={eventDate.id}
            sx={{
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: checked ? 'black' : 'divider',
              bgcolor: checked ? 'rgba(0,0,0,0.03)' : 'background.paper',
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={checked}
                  onChange={(event) =>
                    toggleOccurrence(eventDate, event.target.checked)
                  }
                />
              }
              label={`${eventDate.dow}, ${eventDate.date}`}
            />

            {occurrence && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mt: 1.5 }}
              >
                <TextField
                  required
                  fullWidth
                  type="time"
                  label="Start"
                  InputLabelProps={{ shrink: true }}
                  value={occurrence.startTime}
                  onChange={(event) =>
                    updateOccurrence(eventDate.id, {
                      startTime: event.target.value,
                    })
                  }
                />

                <TextField
                  required
                  fullWidth
                  type="time"
                  label="Ende"
                  InputLabelProps={{ shrink: true }}
                  value={occurrence.endTime}
                  onChange={(event) =>
                    updateOccurrence(eventDate.id, {
                      endTime: event.target.value,
                    })
                  }
                />

                {bookingType === 'INTERNAL_REGISTRATION' && (
                  <TextField
                    fullWidth
                    type="number"
                    label="Kapazität"
                    placeholder="Optional"
                    inputProps={{ min: 1 }}
                    value={occurrence.capacity}
                    onChange={(event) =>
                      updateOccurrence(eventDate.id, {
                        capacity: event.target.value,
                      })
                    }
                  />
                )}
              </Stack>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
