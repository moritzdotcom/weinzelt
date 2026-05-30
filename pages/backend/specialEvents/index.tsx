import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  AddRounded,
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
import CopyButton from '@/components/copyButton';
import { compareEventDates } from '@/lib/eventDates';
import type { Session } from '@/hooks/useSession';
import type { ApiGetEventsResponse } from '../../api/events';
import type { AdminSpecialEvent } from '@/lib/specialEvents';
import type { PublicSpecialEvent } from '@/lib/specialEvents';
import {
  formatSpecialEventCategory,
  formatSpecialEventPrice,
} from '@/lib/specialEvents';
import { SpecialEventCard } from '@/components/specialEventCard';

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

export default function BackendSpecialEventsPage({
  session,
}: {
  session: Session;
}) {
  const router = useRouter();

  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();
  const [specialEvents, setSpecialEvents] = useState<AdminSpecialEvent[]>([]);
  const [selectedSpecialEvent, setSelectedSpecialEvent] =
    useState<AdminSpecialEvent>();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSpecialEvents = async () => {
    if (!selectedEvent?.id) return;

    setLoading(true);
    setLoadError(null);

    try {
      const { data } = await axios.get<AdminSpecialEvent[]>(
        '/api/backend/specialEvents',
        {
          params: {
            eventId: selectedEvent.id,
          },
        },
      );

      const sorted = [...data].sort((a, b) => {
        const dateComparison = compareEventDates(
          a.eventDate.date,
          b.eventDate.date,
        );

        if (dateComparison !== 0) return dateComparison;

        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }

        return a.startTime.localeCompare(b.startTime);
      });

      setSpecialEvents(sorted);
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
  }, [session.status, router.isReady]);

  return (
    <Box className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <Box className="flex flex-col gap-5 border-b border-black/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <Box>
          <Typography
            variant="overline"
            className="font-semibold tracking-[0.2em] text-gray-500"
          >
            Weinzelt Backend
          </Typography>

          <Typography variant="h4" className="mt-1 font-bold">
            WineEvents verwalten
          </Typography>

          <Typography className="mt-2 max-w-2xl text-gray-500">
            Verwalte WineWalks, Tastings und weitere Veranstaltungen inklusive
            Buchungslogik, Bildern und Teilnehmerzahlen.
          </Typography>
        </Box>

        <Link
          href="/backend/specialEvents/new"
          className="inline-flex items-center justify-center gap-1 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
        >
          <AddRounded fontSize="small" />
          Neues WineEvent
        </Link>
      </Box>

      <Box className="my-7 max-w-md">
        <EventSelector onChange={setSelectedEvent} />
      </Box>

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
      ) : specialEvents.length === 0 ? (
        <Box className="rounded-[2rem] border border-dashed border-black/20 bg-stone-50 px-6 py-16 text-center">
          <WineBarRounded sx={{ fontSize: 56, opacity: 0.35 }} />

          <Typography variant="h6" className="mt-3 font-bold">
            Noch keine WineEvents angelegt
          </Typography>

          <Typography className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
            Für dieses Weinzelt-Event existieren noch keine WineWalks, Tastings
            oder weiteren Veranstaltungen.
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
        eventDates={selectedEvent?.eventDates}
        onClose={() => setSelectedSpecialEvent(undefined)}
        onSuccess={() => {
          setSelectedSpecialEvent(undefined);
          void fetchSpecialEvents();
        }}
      />
    </Box>
  );
}

function AdminSpecialEventCard({
  event,
  onEdit,
}: {
  event: AdminSpecialEvent;
  onEdit: () => void;
}) {
  const price = formatSpecialEventPrice(event);

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
                {event.eventDate.dow && `${event.eventDate.dow}, `}
                {event.eventDate.date} · {event.startTime}–{event.endTime} Uhr
              </Typography>
            </Box>

            {event.registeredPersonCount > 0 && (
              <Chip
                size="small"
                icon={<GroupsRounded sx={{ fontSize: '16px !important' }} />}
                label={event.registeredPersonCount}
                color="error"
                variant="outlined"
                sx={{ fontWeight: 700, mx: 0.5 }}
              />
            )}
          </Box>

          <Typography className="mt-4 line-clamp-3 text-sm leading-relaxed text-gray-600">
            {event.description}
          </Typography>

          <Box className="mt-4 flex flex-wrap gap-1.5">
            <Chip
              size="small"
              label={getBookingTypeLabel(event.bookingType)}
              color={getBookingTypeColor(event.bookingType)}
              variant="outlined"
            />

            {price && <Chip size="small" label={price} variant="outlined" />}

            {event.capacity !== null && (
              <Chip
                size="small"
                label={`${event.remainingCapacity ?? 0} von ${event.capacity} frei`}
                variant="outlined"
              />
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

type EditFormState = {
  name: string;
  description: string;
  eventDateId: string;
  startTime: string;
  endTime: string;
  category: PublicSpecialEvent['category'];
  badge: string;
  ctaLabel: string;
  bookingType: PublicSpecialEvent['bookingType'];
  externalUrl: string;
  price: string;
  priceLabel: string;
  capacity: string;
  maxPersonsPerRegistration: string;
  sortOrder: string;
  isPublished: boolean;
};

function getInitialEditForm(event: AdminSpecialEvent): EditFormState {
  return {
    name: event.name,
    description: event.description,
    eventDateId: event.eventDateId,
    startTime: event.startTime,
    endTime: event.endTime,
    category: event.category,
    badge: event.badge ?? '',
    ctaLabel: event.ctaLabel,
    bookingType: event.bookingType,
    externalUrl: event.externalUrl ?? '',
    price:
      event.priceCents === null
        ? ''
        : (event.priceCents / 100).toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
    priceLabel: event.priceLabel ?? '',
    capacity: event.capacity === null ? '' : String(event.capacity),
    maxPersonsPerRegistration: String(event.maxPersonsPerRegistration),
    sortOrder: String(event.sortOrder),
    isPublished: event.isPublished,
  };
}

function toCents(value: string) {
  if (!value.trim()) return '';

  const parsed = Number(value.replace(',', '.'));

  if (!Number.isFinite(parsed)) return '';

  return String(Math.round(parsed * 100));
}

function EditSpecialEventDialog({
  open,
  specialEvent,
  eventDates,
  onClose,
  onSuccess,
}: {
  open: boolean;
  specialEvent: AdminSpecialEvent | undefined;
  eventDates: ApiGetEventsResponse[number]['eventDates'] | undefined;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<EditFormState | null>(null);
  const [titleImage, setTitleImage] = useState<File | null>(null);
  const [titleImagePreview, setTitleImagePreview] = useState<string | null>(
    null,
  );
  const [removeTitleImage, setRemoveTitleImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!specialEvent) return;

    setForm(getInitialEditForm(specialEvent));
    setTitleImage(null);
    setTitleImagePreview(specialEvent.titleImageUrl);
    setRemoveTitleImage(false);
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

  const selectedEventDate = eventDates?.find(
    (eventDate) => eventDate.id === form?.eventDateId,
  );

  const previewEvent = useMemo<PublicSpecialEvent | null>(() => {
    if (!form || !specialEvent) return null;

    return {
      id: specialEvent.id,
      name: form.name || 'Name des WineEvents',
      description:
        form.description ||
        'Beschreibe hier kurz, was die Gäste bei diesem WineEvent erwartet.',
      eventDate: {
        id: selectedEventDate?.id ?? specialEvent.eventDate.id,
        date: selectedEventDate?.date ?? specialEvent.eventDate.date,
        dow: selectedEventDate?.dow ?? specialEvent.eventDate.dow,
      },
      startTime: form.startTime,
      endTime: form.endTime,
      category: form.category,
      badge: form.badge || null,
      titleImageUrl: removeTitleImage ? null : titleImagePreview,
      priceCents: toCents(form.price) ? Number(toCents(form.price)) : null,
      priceLabel: form.priceLabel || null,
      ctaLabel: form.ctaLabel || 'Jetzt anmelden',
      bookingType: form.bookingType,
      externalUrl: form.externalUrl || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      remainingCapacity: form.capacity
        ? Math.max(
            0,
            Number(form.capacity) - specialEvent.registeredPersonCount,
          )
        : null,
      maxPersonsPerRegistration: Number(form.maxPersonsPerRegistration) || 10,
      isSoldOut:
        Boolean(form.capacity) &&
        Number(form.capacity) <= specialEvent.registeredPersonCount,
    };
  }, [
    form,
    removeTitleImage,
    selectedEventDate,
    specialEvent,
    titleImagePreview,
  ]);

  if (!form || !specialEvent || !previewEvent) return null;

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setTitleImage(file);
    setRemoveTitleImage(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setSaving(true);
    setSaveError(null);

    try {
      const body = new FormData();

      body.append('name', form.name);
      body.append('description', form.description);
      body.append('eventDateId', form.eventDateId);
      body.append('startTime', form.startTime);
      body.append('endTime', form.endTime);
      body.append('category', form.category);
      body.append('badge', form.badge);
      body.append('ctaLabel', form.ctaLabel);
      body.append('bookingType', form.bookingType);
      body.append('externalUrl', form.externalUrl);
      body.append('priceCents', toCents(form.price));
      body.append('priceLabel', form.priceLabel);
      body.append('capacity', form.capacity);
      body.append('maxPersonsPerRegistration', form.maxPersonsPerRegistration);
      body.append('sortOrder', form.sortOrder);
      body.append('isPublished', String(form.isPublished));
      body.append('removeTitleImage', String(removeTitleImage));

      if (titleImage) {
        body.append('titleImage', titleImage);
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
                Zeitpunkt und Darstellung
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Tag wählen</InputLabel>
                <Select
                  label="Tag wählen"
                  value={form.eventDateId}
                  onChange={(event) =>
                    updateForm('eventDateId', event.target.value)
                  }
                >
                  {eventDates?.map((date) => (
                    <MenuItem key={date.id} value={date.id}>
                      {date.dow}, {date.date}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  required
                  fullWidth
                  type="time"
                  label="Startzeit"
                  InputLabelProps={{ shrink: true }}
                  value={form.startTime}
                  onChange={(event) =>
                    updateForm('startTime', event.target.value)
                  }
                />

                <TextField
                  required
                  fullWidth
                  type="time"
                  label="Endzeit"
                  InputLabelProps={{ shrink: true }}
                  value={form.endTime}
                  onChange={(event) =>
                    updateForm('endTime', event.target.value)
                  }
                />
              </Stack>

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
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maximale Gesamtkapazität"
                    placeholder="Optional"
                    inputProps={{ min: 1 }}
                    value={form.capacity}
                    onChange={(event) =>
                      updateForm('capacity', event.target.value)
                    }
                  />

                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Max. Personen pro Anmeldung"
                    inputProps={{ min: 1, max: 50 }}
                    value={form.maxPersonsPerRegistration}
                    onChange={(event) =>
                      updateForm(
                        'maxPersonsPerRegistration',
                        event.target.value,
                      )
                    }
                  />
                </Stack>
              )}

              {/* <TextField
                type="number"
                label="Sortierung"
                helperText="Kleinere Zahlen erscheinen zuerst."
                value={form.sortOrder}
                onChange={(event) =>
                  updateForm('sortOrder', event.target.value)
                }
              /> */}

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
