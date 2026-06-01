import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { SaveOutlined } from '@mui/icons-material';
import BackendHeader from '@/components/backend/header';

type Fields = {
  subject: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
};

type FieldErrors = Partial<Record<keyof Fields | 'titleImage', string>>;

const initialFields: Fields = {
  subject: '',
  headline: '',
  body: '',
  ctaLabel: '',
  ctaUrl: '',
};

export default function NewNewsletterPage() {
  const router = useRouter();

  const [fields, setFields] = useState(initialFields);
  const [titleImage, setTitleImage] = useState<File>();
  const [titleImagePreviewUrl, setTitleImagePreviewUrl] = useState<string>();
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((current) => ({
        ...current,
        titleImage: 'Bitte wähle eine JPG-, PNG- oder WebP-Datei aus.',
      }));

      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        titleImage: 'Das Titelbild darf maximal 8 MB groß sein.',
      }));

      return;
    }

    setTitleImage(file);

    setErrors((current) => ({
      ...current,
      titleImage: undefined,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setGlobalError('');

      const formData = new FormData();

      formData.append('subject', fields.subject);
      formData.append('headline', fields.headline);
      formData.append('body', fields.body);
      formData.append('ctaLabel', fields.ctaLabel);
      formData.append('ctaUrl', fields.ctaUrl);

      if (titleImage) {
        formData.append('titleImage', titleImage);
      }

      const response = await axios.post('/api/backend/newsletters', formData);

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

  useEffect(() => {
    if (!titleImage) {
      setTitleImagePreviewUrl(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(titleImage);

    setTitleImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [titleImage]);

  return (
    <Stack
      spacing={3}
      sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8f6f2', minHeight: '100vh' }}
    >
      <BackendHeader
        title="Newsletter erstellen"
        subtitle="Speichere zunächst einen Entwurf. Der Versand wird anschließend
          separat auf der Detailseite gestartet."
        backHref="/backend/newsletter"
        backLabel="Zurück"
      />

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

              <Stack spacing={1}>
                <Typography fontWeight={700}>Titelbild</Typography>

                {titleImagePreviewUrl ? (
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      component="img"
                      src={titleImagePreviewUrl}
                      alt="Newsletter Titelbild"
                      sx={{
                        display: 'block',
                        width: '100%',
                        maxHeight: 240,
                        objectFit: 'cover',
                      }}
                    />

                    <IconButton
                      onClick={() => setTitleImage(undefined)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'background.paper',
                        '&:hover': {
                          bgcolor: 'background.paper',
                        },
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<ImageOutlinedIcon />}
                    sx={{
                      minHeight: 100,
                      borderStyle: 'dashed',
                    }}
                  >
                    Titelbild auswählen
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={handleImageChange}
                    />
                  </Button>
                )}

                {errors.titleImage && (
                  <Typography color="error" variant="caption">
                    {errors.titleImage}
                  </Typography>
                )}

                <Typography color="text.secondary" variant="caption">
                  Optional. Unterstützt werden JPG, PNG und WebP bis maximal 8
                  MB.
                </Typography>
              </Stack>

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
                    <SaveOutlined />
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

          {titleImagePreviewUrl && (
            <Box
              component="img"
              src={titleImagePreviewUrl}
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
