import {
  ArrowBackRounded,
  ArrowForwardRounded,
  CalendarMonthRounded,
  LocalActivityRounded,
  OpenInNewRounded,
  ScheduleRounded,
  WineBarRounded,
} from '@mui/icons-material';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { PublicSpecialEvent } from '@/lib/specialEvents';
import {
  formatSpecialEventCategory,
  formatSpecialEventPrice,
} from '@/lib/specialEvents';
import { SpecialEventRegistrationForm } from '@/components/specialEventRegistrationForm';

function formatDate(eventDate: PublicSpecialEvent['eventDate']) {
  if (eventDate.dow) {
    return `${eventDate.dow}, ${eventDate.date}`;
  }

  const parsedDate = new Date(eventDate.date);

  if (Number.isNaN(parsedDate.getTime())) {
    return eventDate.date;
  }

  return parsedDate.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function InfoPill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
      {icon}
      {children}
    </span>
  );
}

export default function SpecialEventPage({ id }: { id: string }) {
  const [event, setEvent] = useState<PublicSpecialEvent>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const price = useMemo(
    () => (event ? formatSpecialEventPrice(event) : null),
    [event],
  );

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setLoadError(false);

    axios
      .get<PublicSpecialEvent>(`/api/specialEvents/${id}`)
      .then(({ data }) => setEvent(data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box className="flex min-h-screen items-center justify-center bg-[#f8f6f2]">
        <CircularProgress sx={{ color: 'black' }} />
      </Box>
    );
  }

  if (loadError || !event) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] px-4 py-10">
        <Box className="mx-auto max-w-3xl">
          <Link
            href="/#wine-events"
            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 transition hover:text-black"
          >
            <ArrowBackRounded fontSize="small" />
            Zurück zur Hauptseite
          </Link>

          <Alert severity="error" sx={{ mt: 4 }}>
            Dieses WineEvent wurde nicht gefunden oder ist nicht mehr verfügbar.
          </Alert>
        </Box>
      </main>
    );
  }

  const isExternalEvent =
    event.bookingType === 'EXTERNAL_LINK' && Boolean(event.externalUrl);

  const hasInternalRegistration = event.bookingType === 'INTERNAL_REGISTRATION';

  return (
    <main className="min-h-screen bg-[#f8f6f2] px-4 py-6 sm:py-10">
      <Box className="mx-auto max-w-6xl">
        <Link
          href="/#wine-events"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 transition hover:text-black"
        >
          <ArrowBackRounded fontSize="small" />
          Zurück zum Weinzelt
        </Link>

        <Box className="mt-5 overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-xl">
          <Box className="relative min-h-[340px] overflow-hidden bg-stone-100 sm:min-h-[460px]">
            {event.titleImageUrl ? (
              <img
                src={event.titleImageUrl}
                alt={event.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Box className="flex min-h-[340px] items-center justify-center bg-gradient-to-br from-stone-100 via-orange-50 to-rose-100 sm:min-h-[460px]">
                <WineBarRounded sx={{ fontSize: 96, opacity: 0.22 }} />
              </Box>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />

            <Box className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8 md:p-10">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                  {formatSpecialEventCategory(event.category)}
                </span>

                {event.badge && (
                  <span className="rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-black backdrop-blur">
                    {event.badge}
                  </span>
                )}

                {price && (
                  <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                    {price}
                  </span>
                )}
              </div>

              <Typography
                component="h1"
                sx={{ mt: 1, fontSize: { xs: 20, sm: 24, md: 30 } }}
                className="max-w-4xl font-cocogoose leading-tight text-white"
              >
                {event.name}
              </Typography>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
                  <CalendarMonthRounded sx={{ fontSize: 18 }} />
                  {formatDate(event.eventDate)}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
                  <ScheduleRounded sx={{ fontSize: 18 }} />
                  {event.startTime}–{event.endTime} Uhr
                </span>
              </div>
            </Box>
          </Box>

          <Box
            className={`grid gap-0 ${
              hasInternalRegistration
                ? 'lg:grid-cols-[minmax(0,1fr)_420px]'
                : 'grid-cols-1'
            }`}
          >
            <Box className="p-6 sm:p-8 md:p-10">
              <Typography
                variant="overline"
                className="font-semibold tracking-[0.2em] text-gray-500"
              >
                Das erwartet dich
              </Typography>

              <Typography
                component="h2"
                className="mt-2 text-2xl font-bold text-black sm:text-3xl"
              >
                Ein besonderes Erlebnis rund um Wein.
              </Typography>

              <Typography className="mt-5 max-w-3xl whitespace-pre-line text-base leading-relaxed text-gray-700">
                {event.description}
              </Typography>

              <div className="mt-7 flex flex-wrap gap-2">
                <InfoPill icon={<CalendarMonthRounded sx={{ fontSize: 17 }} />}>
                  {formatDate(event.eventDate)}
                </InfoPill>

                <InfoPill icon={<ScheduleRounded sx={{ fontSize: 17 }} />}>
                  {event.startTime}–{event.endTime} Uhr
                </InfoPill>

                {event.remainingCapacity !== null && !event.isSoldOut && (
                  <InfoPill
                    icon={<LocalActivityRounded sx={{ fontSize: 17 }} />}
                  >
                    Noch {event.remainingCapacity}{' '}
                    {event.remainingCapacity === 1 ? 'Platz' : 'Plätze'} frei
                  </InfoPill>
                )}
              </div>

              {event.isSoldOut && (
                <Alert severity="warning" sx={{ mt: 4 }}>
                  Dieses WineEvent ist leider bereits ausgebucht.
                </Alert>
              )}

              {event.bookingType === 'NONE' && (
                <Alert severity="info" sx={{ mt: 4 }}>
                  Für dieses WineEvent ist keine separate Anmeldung
                  erforderlich.
                </Alert>
              )}

              {isExternalEvent && (
                <Box className="mt-8">
                  <a
                    href={event.externalUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800"
                  >
                    {event.ctaLabel}
                    <OpenInNewRounded fontSize="small" />
                  </a>

                  <Typography className="mt-3 text-xs text-gray-500">
                    Die Buchung erfolgt über eine externe
                    Reservierungsplattform.
                  </Typography>
                </Box>
              )}
            </Box>

            {hasInternalRegistration && (
              <Box className="border-t border-black/10 bg-stone-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
                <Box className="lg:sticky lg:top-6">
                  <Typography
                    variant="overline"
                    className="font-semibold tracking-[0.2em] text-gray-500"
                  >
                    Anmeldung
                  </Typography>

                  <Typography
                    component="h2"
                    className="mt-2 text-2xl font-bold text-black"
                  >
                    Sichere dir deinen Platz
                  </Typography>

                  <Typography className="mt-2 text-sm leading-relaxed text-gray-600">
                    Trage deine Kontaktdaten und die gewünschte Personenzahl
                    ein.
                  </Typography>

                  <Box className="mt-6">
                    <SpecialEventRegistrationForm event={event} />
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        <Box className="py-8 text-center">
          <Link
            href="/#wine-events"
            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 transition hover:text-black"
          >
            Alle WineEvents ansehen
            <ArrowForwardRounded fontSize="small" />
          </Link>
        </Box>
      </Box>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id;

  if (typeof id !== 'string') {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      id,
    },
  };
};
