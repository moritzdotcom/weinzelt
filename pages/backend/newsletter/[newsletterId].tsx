import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdsClickOutlinedIcon from '@mui/icons-material/AdsClickOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { ArrowBackRounded } from '@mui/icons-material';

type Recipient = {
  id: string;
  email: string;
  name?: string | null;
  status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
  attemptCount: number;
  sentAt?: string | null;
  failureReason?: string | null;
  ctaClickCount: number;
};

type DetailResponse = {
  newsletter: {
    id: string;
    subject: string;
    headline: string;
    body: string;
    imageUrl?: string | null;
    ctaLabel?: string | null;
    ctaUrl?: string | null;
    status: 'DRAFT' | 'SENDING' | 'SENT';
    createdAt: string;
    startedAt?: string | null;
    sentAt?: string | null;
    recipients: Recipient[];
  };
  stats: {
    total: number;
    pending: number;
    sending: number;
    sent: number;
    failed: number;
    totalClicks: number;
    uniqueClickRecipients: number;
  };
};

function formatDate(value?: string | null) {
  if (!value) return '–';

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function RecipientStatusChip({ recipient }: { recipient: Recipient }) {
  if (recipient.status === 'SENT') {
    return <Chip size="small" color="success" label="Versendet" />;
  }

  if (recipient.status === 'FAILED') {
    return <Chip size="small" color="error" label="Fehlgeschlagen" />;
  }

  if (recipient.status === 'SENDING') {
    return <Chip size="small" color="warning" label="Im Versand" />;
  }

  return <Chip size="small" variant="outlined" label="Ausstehend" />;
}

export default function NewsletterDetailPage() {
  const router = useRouter();
  const newsletterId =
    typeof router.query.newsletterId === 'string'
      ? router.query.newsletterId
      : undefined;

  const [data, setData] = useState<DetailResponse>();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!newsletterId) return;

    const response = await axios.get<DetailResponse>(
      `/api/backend/newsletters/${newsletterId}`,
    );

    setData(response.data);
  }, [newsletterId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sendAllBatches = async () => {
    if (!newsletterId || !data) return;

    try {
      setSending(true);
      setError('');

      if (data.newsletter.status === 'DRAFT') {
        await axios.post(`/api/backend/newsletters/${newsletterId}/start`);
        await loadData();
      }

      let done = false;

      while (!done) {
        const response = await axios.post(
          `/api/backend/newsletters/${newsletterId}/sendBatch`,
        );

        done = response.data.done;

        await loadData();
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ||
            'Der Versand konnte nicht abgeschlossen werden.',
        );
      } else {
        setError('Der Versand konnte nicht abgeschlossen werden.');
      }
    } finally {
      setSending(false);
      await loadData();
    }
  };

  if (!data) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  const { newsletter, stats } = data;
  const progress =
    stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

  return (
    <Stack spacing={3} className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <Box>
        <Link
          href="/backend/newsletter"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 transition hover:text-black"
        >
          <ArrowBackRounded fontSize="small" />
          Zurück
        </Link>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Box>
            <Typography variant="h4" className="mt-1 font-bold">
              {newsletter.subject}
            </Typography>
            <Typography sx={{ mt: 1, color: 'text.secondary' }}>
              Erstellt am {formatDate(newsletter.createdAt)}
            </Typography>
          </Box>

          {newsletter.status !== 'SENT' && (
            <Button
              variant="contained"
              startIcon={
                sending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SendOutlinedIcon />
                )
              }
              disabled={sending}
              onClick={sendAllBatches}
            >
              {newsletter.status === 'DRAFT'
                ? 'Versand starten'
                : 'Versand fortsetzen'}
            </Button>
          )}
        </Stack>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {newsletter.status === 'SENDING' && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>Versandfortschritt</Typography>
                <Typography>{progress} %</Typography>
              </Stack>

              <LinearProgress variant="determinate" value={progress} />

              <Typography color="text.secondary" variant="body2">
                {stats.sent} von {stats.total} Empfängern erfolgreich
                verarbeitet.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Card sx={{ flex: 1, borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <EmailOutlinedIcon />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {stats.sent}
                </Typography>
                <Typography color="text.secondary">
                  erfolgreich versendet
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AdsClickOutlinedIcon />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {stats.uniqueClickRecipients}
                </Typography>
                <Typography color="text.secondary">
                  eindeutige CTA-Klicks
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={700}>
              {stats.totalClicks}
            </Typography>
            <Typography color="text.secondary">CTA-Klicks insgesamt</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={700}>
              {stats.failed}
            </Typography>
            <Typography color="text.secondary">
              fehlgeschlagene Zustellungen
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        {newsletter.imageUrl && (
          <Box
            component="img"
            src={newsletter.imageUrl}
            alt=""
            sx={{
              width: '100%',
              maxHeight: 320,
              objectFit: 'cover',
            }}
          />
        )}

        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              {newsletter.headline}
            </Typography>

            <Typography whiteSpace="pre-wrap">{newsletter.body}</Typography>

            {newsletter.ctaLabel && (
              <Box>
                <Button variant="contained">{newsletter.ctaLabel}</Button>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} mb={1}>
            Empfänger
          </Typography>

          <Stack divider={<Divider />}>
            {newsletter.recipients.map((recipient) => (
              <Stack
                key={recipient.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                justifyContent="space-between"
                py={2}
              >
                <Box>
                  <Typography fontWeight={700}>
                    {recipient.name || 'Ohne Namen'}
                  </Typography>

                  <Typography color="text.secondary" variant="body2">
                    {recipient.email}
                  </Typography>

                  {recipient.failureReason && (
                    <Typography color="error" variant="caption">
                      {recipient.failureReason}
                    </Typography>
                  )}
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                >
                  {recipient.ctaClickCount > 0 && (
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={`${recipient.ctaClickCount} CTA-Klick${
                        recipient.ctaClickCount === 1 ? '' : 's'
                      }`}
                    />
                  )}

                  {recipient.attemptCount > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${recipient.attemptCount} Versuch${
                        recipient.attemptCount === 1 ? '' : 'e'
                      }`}
                    />
                  )}

                  <RecipientStatusChip recipient={recipient} />
                </Stack>
              </Stack>
            ))}

            {newsletter.recipients.length === 0 && (
              <Typography color="text.secondary" py={2}>
                Der Versand wurde noch nicht gestartet.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
