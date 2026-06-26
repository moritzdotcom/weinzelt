import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircleRounded, LocalActivityRounded } from '@mui/icons-material';
import type {
  PublicSpecialEvent,
  PublicSpecialEventOccurrence,
} from '@/lib/specialEvents';
import NewsletterConfirmation from './reservation/newsletterConfirmation';
import { ApiPostSpecialEventRegisterResponse } from '@/pages/api/specialEvents/[specialEventId]/register';

function RenderAlert({
  occurrence,
}: {
  occurrence: PublicSpecialEventOccurrence;
}) {
  if (occurrence.remainingCapacity === null) return null;
  if (occurrence.isSoldOut) {
    return (
      <Alert severity="error" icon={<LocalActivityRounded />}>
        Dieser Termin ist leider schon ausgebucht.
      </Alert>
    );
  }
  return (
    <Alert
      severity={occurrence.remainingCapacity <= 5 ? 'warning' : 'info'}
      icon={<LocalActivityRounded />}
    >
      Noch {occurrence.remainingCapacity}{' '}
      {occurrence.remainingCapacity === 1 ? 'Platz' : 'Plätze'} für diesen
      Termin verfügbar.
    </Alert>
  );
}

export function SpecialEventRegistrationForm({
  event,
  onRegistered,
  submitLabel = 'Verbindlich anmelden',
}: {
  event: PublicSpecialEvent;
  onRegistered?: () => void;
  submitLabel?: string;
}) {
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState(
    event.occurrences[0]?.id ?? '',
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [personCount, setPersonCount] = useState(1);
  const [newsletterConfirmation, setNewsletterConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOccurrenceId(event.occurrences[0]?.id ?? '');
    setName('');
    setEmail('');
    setPhone('');
    setPersonCount(1);
    setSaving(false);
    setSuccess(false);
    setError(null);
  }, [event.id]);

  const selectedOccurrence = useMemo(
    () =>
      event.occurrences.find(
        (occurrence) => occurrence.id === selectedOccurrenceId,
      ) ?? event.occurrences[0],
    [event.occurrences, selectedOccurrenceId],
  );

  const maxSelectablePersons = useMemo(() => {
    if (!selectedOccurrence) return 1;

    const remainingCapacity =
      selectedOccurrence.remainingCapacity ?? event.maxPersonsPerRegistration;

    return Math.max(
      1,
      Math.min(event.maxPersonsPerRegistration, remainingCapacity),
    );
  }, [event.maxPersonsPerRegistration, selectedOccurrence]);

  function formatOccurrenceLabel(
    occurrence: PublicSpecialEvent['occurrences'][number],
  ) {
    const dateLabel = occurrence.eventDate.dow
      ? `${occurrence.eventDate.dow}, ${occurrence.eventDate.date}`
      : occurrence.eventDate.date;

    return `${dateLabel} · ${occurrence.startTime}–${occurrence.endTime} Uhr`;
  }

  const requiresPayment = Boolean(event.priceCents && event.priceCents > 0);

  const buttonLabel = requiresPayment ? 'Weiter zur Zahlung' : submitLabel;

  const handleSubmit = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();

    setSaving(true);
    setError(null);

    try {
      const response = await axios.post<ApiPostSpecialEventRegisterResponse>(
        `/api/specialEvents/${event.id}/register`,
        {
          name,
          email,
          phone: phone || undefined,
          personCount,
          newsletterConfirmation,
          specialEventOccurrenceId: selectedOccurrence.id,
        },
      );

      if ('url' in response.data && response.data.requiresPayment) {
        window.location.href = response.data.url;
        return;
      }

      setSuccess(true);
      onRegistered?.();
    } catch (submitError) {
      if (axios.isAxiosError(submitError)) {
        setError(
          submitError.response?.data?.error ||
            'Die Anmeldung konnte nicht gespeichert werden.',
        );
      } else {
        setError('Die Anmeldung konnte nicht gespeichert werden.');
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setError(null);
  }, [selectedOccurrenceId]);

  if (success) {
    return (
      <Box className="py-5 text-center">
        <CheckCircleRounded color="success" sx={{ fontSize: 72, mb: 2 }} />

        <Typography variant="h5" fontWeight={800}>
          Anmeldung gespeichert
        </Typography>

        <Typography sx={{ mt: 1.5, color: 'text.secondary' }}>
          Vielen Dank! Deine Anmeldung für {event.name} ist bei uns eingegangen.
        </Typography>
      </Box>
    );
  }

  if (!selectedOccurrence) {
    return (
      <Alert severity="warning">
        Für dieses WineEvent ist aktuell kein Termin verfügbar.
      </Alert>
    );
  }

  if (event.isSoldOut) {
    return (
      <Alert severity="warning">
        Dieses WineEvent ist leider bereits ausgebucht.
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2.5} mt={1}>
        <RenderAlert occurrence={selectedOccurrence} />

        {error && <Alert severity="error">{error}</Alert>}

        {event.occurrences.length > 1 && (
          <TextField
            required
            select
            label="Termin auswählen"
            value={selectedOccurrenceId}
            onChange={(inputEvent) => {
              setSelectedOccurrenceId(inputEvent.target.value);
              setPersonCount(1);
            }}
          >
            {event.occurrences.map((occurrence) => (
              <MenuItem
                key={occurrence.id}
                value={occurrence.id}
                disabled={occurrence.isSoldOut}
              >
                {formatOccurrenceLabel(occurrence)}
                {occurrence.isSoldOut ? ' · ausgebucht' : ''}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          required
          label="Name"
          autoComplete="name"
          value={name}
          onChange={(inputEvent) => setName(inputEvent.target.value)}
        />

        <TextField
          required
          type="email"
          label="E-Mail-Adresse"
          autoComplete="email"
          value={email}
          onChange={(inputEvent) => setEmail(inputEvent.target.value)}
        />

        <TextField
          type="tel"
          label="Telefonnummer"
          autoComplete="tel"
          helperText="Optional"
          value={phone}
          onChange={(inputEvent) => setPhone(inputEvent.target.value)}
        />

        <TextField
          required
          select
          label="Personenzahl"
          value={personCount}
          onChange={(inputEvent) =>
            setPersonCount(Number(inputEvent.target.value))
          }
        >
          {Array.from(
            { length: maxSelectablePersons },
            (_, index) => index + 1,
          ).map((value) => (
            <MenuItem key={value} value={value}>
              {value} {value === 1 ? 'Person' : 'Personen'}
            </MenuItem>
          ))}
        </TextField>

        <NewsletterConfirmation onChecked={setNewsletterConfirmation} />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={saving || selectedOccurrence.isSoldOut}
          startIcon={saving ? <CircularProgress size={18} /> : undefined}
          sx={{
            borderRadius: 999,
            py: 1.4,
            bgcolor: 'black',
            '&:hover': {
              bgcolor: '#262626',
            },
          }}
        >
          {saving
            ? requiresPayment
              ? 'Zahlung wird vorbereitet …'
              : 'Anmeldung wird gespeichert …'
            : buttonLabel}
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {requiresPayment
            ? 'Nach dem Absenden wirst du zur sicheren Zahlung weitergeleitet. Deine Anmeldung ist erst nach erfolgreicher Zahlung abgeschlossen.'
            : 'Mit dem Absenden meldest du dich verbindlich für das Event an.'}
        </Typography>
      </Stack>
    </Box>
  );
}
