import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { SaveOutlined } from '@mui/icons-material';
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
import { useCallback, useEffect, useState } from 'react';
import BackendHeader from '@/components/backend/header';
import { ApiGetNewsletterBackendResponse } from '@/pages/api/backend/newsletters/[newsletterId]';

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

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageSizeInBytes = 8 * 1024 * 1024;

export default function EditNewsletterPage() {
  const router = useRouter();

  const newsletterId =
    typeof router.query.newsletterId === 'string'
      ? router.query.newsletterId
      : undefined;

  const [fields, setFields] = useState(initialFields);

  const [existingTitleImageUrl, setExistingTitleImageUrl] = useState<string>();
  const [titleImage, setTitleImage] = useState<File>();
  const [titleImagePreviewUrl, setTitleImagePreviewUrl] = useState<string>();
  const [removeTitleImage, setRemoveTitleImage] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const previewImageUrl =
    titleImagePreviewUrl ||
    (!removeTitleImage ? existingTitleImageUrl : undefined);

  const updateField = (key: keyof Fields, value: string) => {
    setFields((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));

    setGlobalError('');
  };

  const validateBeforeSave = () => {
    const nextErrors: FieldErrors = {};

    const hasCtaLabel = fields.ctaLabel.trim().length > 0;
    const hasCtaUrl = fields.ctaUrl.trim().length > 0;

    if (hasCtaLabel && !hasCtaUrl) {
      nextErrors.ctaUrl = 'Bitte gib ein Ziel für den Button ein.';
    }

    if (!hasCtaLabel && hasCtaUrl) {
      nextErrors.ctaLabel = 'Bitte gib eine Beschriftung für den Button ein.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors((current) => ({
        ...current,
        ...nextErrors,
      }));

      return false;
    }

    return true;
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        titleImage: 'Bitte wähle eine JPG-, PNG- oder WebP-Datei aus.',
      }));

      event.target.value = '';
      return;
    }

    if (file.size > maxImageSizeInBytes) {
      setErrors((current) => ({
        ...current,
        titleImage: 'Das Titelbild darf maximal 8 MB groß sein.',
      }));

      event.target.value = '';
      return;
    }

    setTitleImage(file);
    setRemoveTitleImage(false);
    setGlobalError('');

    setErrors((current) => ({
      ...current,
      titleImage: undefined,
    }));

    event.target.value = '';
  };

  const handleRemoveImage = () => {
    setTitleImage(undefined);
    setTitleImagePreviewUrl(undefined);
    setExistingTitleImageUrl(undefined);
    setRemoveTitleImage(true);
    setGlobalError('');

    setErrors((current) => ({
      ...current,
      titleImage: undefined,
    }));
  };

  const handleSave = async () => {
    if (!newsletterId) return;
    if (!validateBeforeSave()) return;

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

      if (removeTitleImage) {
        formData.append('removeTitleImage', 'true');
      }

      const { data } = await axios.put(
        `/api/backend/newsletters/${newsletterId}/update`,
        formData,
      );

      await router.push(`/backend/newsletter/${data.newsletter.id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrors(error.response?.data?.details || {});
        setGlobalError(
          error.response?.data?.error ||
            'Der Newsletter konnte nicht gespeichert werden.',
        );

        return;
      }

      setGlobalError('Der Newsletter konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!router.isReady) return;

    if (!newsletterId) {
      setLoading(false);
      setGlobalError('Der Newsletter konnte nicht gefunden werden.');
      return;
    }

    try {
      setLoading(true);
      setGlobalError('');

      const { data } = await axios.get<ApiGetNewsletterBackendResponse>(
        `/api/backend/newsletters/${newsletterId}`,
      );

      const newsletter = data.newsletter;

      setFields({
        subject: newsletter.subject,
        headline: newsletter.headline,
        body: newsletter.body,
        ctaLabel: newsletter.ctaLabel || '',
        ctaUrl: newsletter.ctaUrl || '',
      });

      setExistingTitleImageUrl(newsletter.imageUrl || undefined);
      setTitleImage(undefined);
      setTitleImagePreviewUrl(undefined);
      setRemoveTitleImage(false);
      setErrors({});
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setGlobalError(
          error.response?.data?.error ||
            'Der Newsletter konnte nicht geladen werden.',
        );

        return;
      }

      setGlobalError('Der Newsletter konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [newsletterId, router.isReady]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
        title="Newsletter bearbeiten"
        subtitle="Passe Betreff, Inhalt, Titelbild und CTA des Newsletter-Entwurfs an."
        backHref={
          newsletterId
            ? `/backend/newsletter/${newsletterId}`
            : '/backend/newsletter'
        }
        backLabel="Zurück"
      />

      {globalError && <Alert severity="error">{globalError}</Alert>}

      {loading ? (
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={22} />
              <Typography color="text.secondary">
                Newsletter wird geladen...
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  label="E-Mail-Betreff"
                  value={fields.subject}
                  onChange={(event) =>
                    updateField('subject', event.target.value)
                  }
                  error={Boolean(errors.subject)}
                  helperText={errors.subject}
                  disabled={saving}
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
                  disabled={saving}
                  fullWidth
                />

                <Stack spacing={1}>
                  <Typography fontWeight={700}>Titelbild</Typography>

                  {previewImageUrl ? (
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
                        src={previewImageUrl}
                        alt="Newsletter Titelbild"
                        sx={{
                          display: 'block',
                          width: '100%',
                          maxHeight: 240,
                          objectFit: 'cover',
                        }}
                      />

                      <IconButton
                        onClick={handleRemoveImage}
                        disabled={saving}
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
                      disabled={saving}
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
                        disabled={saving}
                        onChange={handleImageChange}
                      />
                    </Button>
                  )}

                  {previewImageUrl && (
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<ImageOutlinedIcon />}
                      disabled={saving}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Titelbild ersetzen
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
                  fullWidth
                />

                <TextField
                  label="Button-Ziel"
                  value={fields.ctaUrl}
                  onChange={(event) =>
                    updateField('ctaUrl', event.target.value)
                  }
                  error={Boolean(errors.ctaUrl)}
                  helperText={errors.ctaUrl}
                  disabled={saving}
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
                  disabled={saving || !newsletterId}
                  onClick={handleSave}
                >
                  Änderungen speichern
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, alignSelf: 'flex-start' }}>
            <Box px={2.5} py={2}>
              <Typography fontWeight={800}>Vorschau</Typography>
            </Box>

            <Divider />

            {previewImageUrl && (
              <Box
                component="img"
                src={previewImageUrl}
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
      )}
    </Stack>
  );
}
