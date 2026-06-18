import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddPhotoAlternateRounded,
  AttachFileRounded,
  SaveRounded,
} from '@mui/icons-material';
import { SpecialEventCard } from '@/components/specialEventCard';
import type { PublicSpecialEvent } from '@/lib/specialEvents';
import EventSelector from '@/components/eventSelector';
import { ApiGetEventsResponse } from '@/pages/api/events';
import BackendHeader from '@/components/backend/header';

type FormState = {
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
  attachmentLabel: string;
};

const initialForm: FormState = {
  name: '',
  description: '',
  eventDateId: '',
  startTime: '15:00',
  endTime: '17:00',
  category: 'WINE_TASTING',
  badge: '',
  ctaLabel: 'Jetzt anmelden',
  bookingType: 'INTERNAL_REGISTRATION',
  externalUrl: '',
  price: '',
  priceLabel: '',
  capacity: '',
  maxPersonsPerRegistration: '10',
  sortOrder: '0',
  isPublished: false,
  attachmentLabel: '',
};

function toCents(value: string) {
  if (!value.trim()) return '';

  const parsed = Number(value.replace(',', '.'));

  if (!Number.isFinite(parsed)) return '';

  return String(Math.round(parsed * 100));
}

export default function NewSpecialEventPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();
  const [titleImage, setTitleImage] = useState<File | null>(null);
  const [titleImagePreview, setTitleImagePreview] = useState<string | null>(
    null,
  );
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventDates =
    selectedEvent?.eventDates.sort((a, b) => a.date.localeCompare(b.date)) ||
    [];

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setAttachment(file);
  };

  useEffect(() => {
    if (!titleImage) {
      setTitleImagePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(titleImage);
    setTitleImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [titleImage]);

  const selectedEventDate =
    eventDates.find((eventDate) => eventDate.id === form.eventDateId) ??
    eventDates[0];

  const previewEvent = useMemo<PublicSpecialEvent>(
    () => ({
      id: 'preview',
      name: form.name || 'Name des WineEvents',
      description:
        form.description ||
        'Beschreibe hier kurz, was die Gäste bei diesem WineEvent erwartet.',
      eventDate: {
        id: selectedEventDate?.id ?? 'preview-date',
        date: selectedEventDate?.date ?? new Date().toISOString(),
      },
      startTime: form.startTime,
      endTime: form.endTime,
      category: form.category,
      badge: form.badge || null,
      titleImageUrl: titleImagePreview,
      priceCents: toCents(form.price) ? Number(toCents(form.price)) : null,
      priceLabel: form.priceLabel || null,
      ctaLabel: form.ctaLabel || 'Jetzt anmelden',
      bookingType: form.bookingType,
      externalUrl: form.externalUrl || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      remainingCapacity: form.capacity ? Number(form.capacity) : null,
      maxPersonsPerRegistration: Number(form.maxPersonsPerRegistration) || 10,
      isSoldOut: false,
      attachmentUrl: null,
      attachmentLabel: form.attachmentLabel || null,
    }),
    [form, selectedEventDate, titleImagePreview],
  );

  const updateForm = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setTitleImage(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

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
      body.append('attachmentLabel', form.attachmentLabel);

      if (attachment) {
        body.append('attachment', attachment);
      }

      if (titleImage) {
        body.append('titleImage', titleImage);
      }

      await axios.post('/api/backend/specialEvents/create', body);

      await router.push('/backend/specialEvents');
    } catch (submitError) {
      if (axios.isAxiosError(submitError)) {
        setError(
          submitError.response?.data?.error ||
            'Das WineEvent konnte nicht angelegt werden.',
        );
      } else {
        setError('Das WineEvent konnte nicht angelegt werden.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8f6f2', minHeight: '100vh' }}>
      <BackendHeader
        title="Neues WineEvent anlegen"
        subtitle="Lege WineWalks, Tastings und weitere Erlebnisse für die Website an."
        backHref="/backend/specialEvents"
        backLabel="Zurück zu den WineEvents"
      />

      <Box sx={{ maxWidth: 1440, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            mt: 4,
            display: 'grid',
            gap: 3,
            alignItems: 'start',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(0, 1fr) 420px',
            },
          }}
        >
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700}>
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

                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<AddPhotoAlternateRounded />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Titelbild auswählen
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                  />
                </Button>

                {titleImage && (
                  <Typography variant="caption" color="text.secondary">
                    {titleImage.name}
                  </Typography>
                )}

                <Divider />

                <Typography variant="h6" fontWeight={700}>
                  Zeitpunkt und Darstellung
                </Typography>

                <EventSelector onChange={setSelectedEvent} />

                <FormControl fullWidth>
                  <InputLabel>Veranstaltungstag</InputLabel>
                  <Select
                    required
                    label="Veranstaltungstag"
                    value={form.eventDateId}
                    onChange={(event) =>
                      updateForm('eventDateId', event.target.value)
                    }
                  >
                    {eventDates.map((eventDate) => (
                      <MenuItem key={eventDate.id} value={eventDate.id}>
                        {eventDate.date}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    required
                    fullWidth
                    type="time"
                    label="Start"
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
                    label="Ende"
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
                        event.target.value as FormState['category'],
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
                  placeholder="z. B. Limitiert, Neu oder Special"
                  value={form.badge}
                  onChange={(event) => updateForm('badge', event.target.value)}
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Preis in Euro"
                    placeholder="29,90"
                    value={form.price}
                    onChange={(event) =>
                      updateForm('price', event.target.value)
                    }
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

                <Typography variant="h6" fontWeight={700}>
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
                        event.target.value as FormState['bookingType'],
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

                <Divider />

                <Typography variant="h6" fontWeight={700}>
                  Anhang
                </Typography>

                <TextField
                  label="Anhang-Label"
                  placeholder="z. B. Speisekarte ansehen oder PDF mit weiteren Infos"
                  value={form.attachmentLabel}
                  onChange={(event) =>
                    updateForm('attachmentLabel', event.target.value)
                  }
                  helperText="Optional. Wird auf der Detailseite als Titel des Anhangs angezeigt."
                />

                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<AttachFileRounded />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Anhang auswählen
                  <input
                    hidden
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={handleAttachmentChange}
                  />
                </Button>

                {attachment && (
                  <Typography variant="caption" color="text.secondary">
                    Anhang: {attachment.name}
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
                  label="Direkt auf der Website veröffentlichen"
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={saving}
                  startIcon={
                    saving ? <CircularProgress size={18} /> : <SaveRounded />
                  }
                  sx={{ alignSelf: 'flex-start' }}
                >
                  WineEvent speichern
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
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
      </Box>
    </Box>
  );
}
