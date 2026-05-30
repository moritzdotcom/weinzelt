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
import type { PublicSpecialEvent } from '@/lib/specialEvents';

export function SpecialEventRegistrationForm({
  event,
  onRegistered,
  submitLabel = 'Verbindlich anmelden',
}: {
  event: PublicSpecialEvent;
  onRegistered?: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [personCount, setPersonCount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName('');
    setEmail('');
    setPhone('');
    setPersonCount(1);
    setSaving(false);
    setSuccess(false);
    setError(null);
  }, [event.id]);

  const maxSelectablePersons = useMemo(() => {
    const remainingCapacity =
      event.remainingCapacity ?? event.maxPersonsPerRegistration;

    return Math.max(
      1,
      Math.min(event.maxPersonsPerRegistration, remainingCapacity),
    );
  }, [event.maxPersonsPerRegistration, event.remainingCapacity]);

  const handleSubmit = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();

    setSaving(true);
    setError(null);

    try {
      await axios.post(`/api/specialEvents/${event.id}/register`, {
        name,
        email,
        phone: phone || undefined,
        personCount,
      });

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

  if (event.isSoldOut) {
    return (
      <Alert severity="warning">
        Dieses WineEvent ist leider bereits ausgebucht.
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2.5}>
        {event.remainingCapacity !== null && (
          <Alert
            severity={event.remainingCapacity <= 5 ? 'warning' : 'info'}
            icon={<LocalActivityRounded />}
          >
            Noch {event.remainingCapacity}{' '}
            {event.remainingCapacity === 1 ? 'Platz' : 'Plätze'} verfügbar.
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}

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

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={saving}
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
          {saving ? 'Anmeldung wird gespeichert …' : submitLabel}
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          Mit dem Absenden meldest du dich verbindlich für das Event an.
        </Typography>
      </Stack>
    </Box>
  );
}
