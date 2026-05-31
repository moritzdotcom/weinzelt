import { ArrowBackRounded } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

type Fields = {
  subject: string;
  headline: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
};

type FieldErrors = Partial<Record<keyof Fields, string>>;

const initialFields: Fields = {
  subject: '',
  headline: '',
  body: '',
  imageUrl: '',
  ctaLabel: '',
  ctaUrl: '',
};

export default function NewNewsletterPage() {
  const router = useRouter();

  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const updateField = (key: keyof Fields, value: string) => {
    setFields((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setGlobalError('');

      const response = await axios.post('/api/backend/newsletters', fields);

      await router.push(`/backend/newsletter/${response.data.newsletter.id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrors(error.response?.data?.details || {});
        setGlobalError(
          error.response?.data?.error ||
            'Der Newsletter konnte nicht gespeichert werden.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack
      spacing={3}
      sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8f6f2', minHeight: '100vh' }}
    >
      <Box>
        <Link
          href="/backend/newsletter"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 transition hover:text-black"
        >
          <ArrowBackRounded fontSize="small" />
          Zurück
        </Link>

        <Typography variant="h4" className="mt-1 font-bold">
          Newsletter erstellen
        </Typography>

        <Typography sx={{ mt: 1, color: 'text.secondary' }}>
          Speichere zunächst einen Entwurf. Der Versand wird anschließend
          separat auf der Detailseite gestartet.
        </Typography>
      </Box>

      {globalError && <Alert severity="error">{globalError}</Alert>}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack spacing={2.5}>
              <TextField
                label="E-Mail-Betreff"
                value={fields.subject}
                onChange={(event) => updateField('subject', event.target.value)}
                error={Boolean(errors.subject)}
                helperText={errors.subject}
                fullWidth
              />

              <TextField
                label="Überschrift"
                value={fields.headline}
                onChange={(event) =>
                  updateField('headline', event.target.value)
                }
                error={Boolean(errors.headline)}
                helperText={errors.headline}
                fullWidth
              />

              <TextField
                label="Titelbild-URL"
                value={fields.imageUrl}
                onChange={(event) =>
                  updateField('imageUrl', event.target.value)
                }
                error={Boolean(errors.imageUrl)}
                helperText={
                  errors.imageUrl ||
                  'Später kannst du hier deinen bestehenden Image-Upload einsetzen.'
                }
                fullWidth
              />

              <TextField
                label="Text"
                value={fields.body}
                onChange={(event) => updateField('body', event.target.value)}
                error={Boolean(errors.body)}
                helperText={errors.body}
                minRows={8}
                multiline
                fullWidth
              />

              <Divider />

              <Typography fontWeight={700}>CTA-Button</Typography>

              <TextField
                label="Button-Beschriftung"
                value={fields.ctaLabel}
                onChange={(event) =>
                  updateField('ctaLabel', event.target.value)
                }
                error={Boolean(errors.ctaLabel)}
                helperText={errors.ctaLabel}
                fullWidth
              />

              <TextField
                label="Button-Ziel"
                value={fields.ctaUrl}
                onChange={(event) => updateField('ctaUrl', event.target.value)}
                error={Boolean(errors.ctaUrl)}
                helperText={errors.ctaUrl}
                placeholder="https://dasweinzelt.de/..."
                fullWidth
              />

              <Button
                variant="contained"
                startIcon={
                  saving ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveOutlinedIcon />
                  )
                }
                disabled={saving}
                onClick={handleSave}
              >
                Entwurf speichern
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, alignSelf: 'flex-start' }}>
          <Box px={2.5} py={2}>
            <Typography fontWeight={800}>Vorschau</Typography>
          </Box>

          <Divider />

          {fields.imageUrl && (
            <Box
              component="img"
              src={fields.imageUrl}
              alt=""
              sx={{
                display: 'block',
                width: '100%',
                maxHeight: 260,
                objectFit: 'cover',
              }}
            />
          )}

          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={800} textAlign="center">
                {fields.headline || 'Deine Überschrift'}
              </Typography>

              <Typography whiteSpace="pre-wrap">
                {fields.body || 'Hier erscheint dein Newsletter-Text.'}
              </Typography>

              {fields.ctaLabel && (
                <Box textAlign="center">
                  <Button variant="contained">{fields.ctaLabel}</Button>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
