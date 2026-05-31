import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Newsletter = {
  id: string;
  subject: string;
  headline: string;
  status: 'DRAFT' | 'SENDING' | 'SENT';
  createdAt: string;
  startedAt?: string | null;
  sentAt?: string | null;
  _count: {
    recipients: number;
  };
};

type Subscription = {
  id: string;
  name?: string | null;
  email: string;
  confirmed: boolean;
  unsubscribedAt?: string | null;
  createdAt: string;
};

type ApiResponse = {
  newsletters: Newsletter[];
  subscriptions: Subscription[];
};

function formatDate(value?: string | null) {
  if (!value) return '–';

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getStatusChip(newsletter: Newsletter) {
  if (newsletter.status === 'SENT') {
    return <Chip size="small" color="success" label="Versendet" />;
  }

  if (newsletter.status === 'SENDING') {
    return <Chip size="small" color="warning" label="Im Versand" />;
  }

  return <Chip size="small" variant="outlined" label="Entwurf" />;
}

export default function NewsletterOverviewPage() {
  const [data, setData] = useState<ApiResponse>();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    axios
      .get<ApiResponse>('/api/backend/newsletters')
      .then((response) => setData(response.data));
  }, []);

  if (!data) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  const activeSubscriptions = data.subscriptions.filter(
    (subscription) => subscription.confirmed && !subscription.unsubscribedAt,
  ).length;

  return (
    <Stack spacing={3} className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <Box className="flex flex-col gap-5 border-b border-black/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <Box>
          <Typography
            variant="overline"
            className="font-semibold tracking-[0.2em] text-gray-500"
          >
            Weinzelt Backend
          </Typography>

          <Typography variant="h4" className="mt-1 font-bold">
            Newsletter
          </Typography>

          <Typography className="mt-2 max-w-2xl text-gray-500">
            Entwürfe erstellen, Versand prüfen und Anmeldungen verwalten.
          </Typography>
        </Box>

        <Link
          href="/backend/newsletter/new"
          className="inline-flex items-center justify-center gap-1 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
        >
          <AddIcon fontSize="small" />
          Newsletter erstellen
        </Link>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Card sx={{ flex: 1, borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <EmailOutlinedIcon />
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  {activeSubscriptions}
                </Typography>
                <Typography color="text.secondary">
                  aktive Anmeldungen
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CheckCircleOutlineIcon />
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  {
                    data.newsletters.filter(
                      (newsletter) => newsletter.status === 'SENT',
                    ).length
                  }
                </Typography>
                <Typography color="text.secondary">
                  versendete Newsletter
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <DraftsOutlinedIcon />
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  {
                    data.newsletters.filter(
                      (newsletter) => newsletter.status === 'DRAFT',
                    ).length
                  }
                </Typography>
                <Typography color="text.secondary">offene Entwürfe</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Newsletter" />
          <Tab label="Subscriptions" />
        </Tabs>

        <Divider />

        <CardContent>
          {tab === 0 ? (
            <Stack divider={<Divider />}>
              {data.newsletters.map((newsletter) => (
                <Stack
                  key={newsletter.id}
                  component={Link}
                  href={`/backend/newsletter/${newsletter.id}`}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  justifyContent="space-between"
                  py={2}
                  sx={{
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <Box>
                    <Typography fontWeight={700}>
                      {newsletter.subject}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {newsletter.headline}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Chip
                      size="small"
                      label={`${newsletter._count.recipients} Empfänger`}
                    />
                    {getStatusChip(newsletter)}
                    <Typography color="text.secondary" variant="caption">
                      {formatDate(newsletter.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              ))}

              {data.newsletters.length === 0 && (
                <Typography color="text.secondary" py={2}>
                  Es wurden noch keine Newsletter erstellt.
                </Typography>
              )}
            </Stack>
          ) : (
            <Stack divider={<Divider />}>
              {data.subscriptions.map((subscription) => (
                <Stack
                  key={subscription.id}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  justifyContent="space-between"
                  py={2}
                >
                  <Box>
                    <Typography fontWeight={700}>
                      {subscription.name || 'Ohne Namen'}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {subscription.email}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    {subscription.unsubscribedAt ? (
                      <Chip size="small" color="error" label="Abgemeldet" />
                    ) : subscription.confirmed ? (
                      <Chip size="small" color="success" label="Bestätigt" />
                    ) : (
                      <Chip
                        size="small"
                        variant="outlined"
                        label="Nicht bestätigt"
                      />
                    )}

                    <Typography color="text.secondary" variant="caption">
                      {formatDate(subscription.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
