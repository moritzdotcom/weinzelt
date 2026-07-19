import { ExpandMore, KeyboardArrowRight } from '@mui/icons-material';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EventDay, eventDays } from '@/lib/events';
import {
  getOperationalDate,
  getRelevantEventDayIndex,
  isSameCalendarDay,
  parseEventDayDate,
} from '@/lib/weinzeltDates';

function InstagramGradientIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="url(#instagram-gradient)"
    >
      <defs>
        <linearGradient
          id="instagram-gradient"
          x1="0%"
          y1="100%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="25%" stopColor="#fa7e1e" />
          <stop offset="50%" stopColor="#d62976" />
          <stop offset="75%" stopColor="#962fbf" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm8.88 1.75a.88.88 0 1 1 0 1.76.88.88 0 0 1 0-1.76ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" />
    </svg>
  );
}

function DjChips({ djs }: { djs: EventDay['djs']['headliner'] }) {
  if (!djs?.length) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {djs.map((dj) => (
        <div
          key={dj.name}
          className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-2 shadow-sm"
        >
          <div className="leading-tight">
            <p className="text-sm font-semibold text-black">{dj.name}</p>
            {dj.genre && (
              <p className="text-[11px] text-gray-500">{dj.genre}</p>
            )}
          </div>

          {dj.instagramUrl && (
            <Link
              href={dj.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram von ${dj.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100"
            >
              <InstagramGradientIcon className="h-5 w-5" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

function SpecialsGrid({ specials }: { specials: EventDay['specials'] }) {
  if (!specials?.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {specials.map((special, index) => {
        const isExternal = Boolean(
          special.link && /^https?:\/\//i.test(special.link),
        );

        return (
          <div
            key={`${special.title}-${special.time ?? 'no-time'}-${index}`}
            className="flex h-full flex-col rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              {special.time ? (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {special.time}
                </p>
              ) : (
                <span />
              )}

              {special.badge && (
                <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                  {special.badge}
                </span>
              )}
            </div>

            <h4 className="mt-2 text-lg font-semibold leading-tight text-black">
              {special.title}
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {special.description}
            </p>

            {special.link && special.ctaLabel && (
              <div className="mt-auto pt-4">
                <Link
                  href={special.link}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center text-sm font-medium text-black underline underline-offset-4"
                >
                  {special.ctaLabel}
                  <KeyboardArrowRight fontSize="inherit" />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EventDayCard({
  day,
  isCurrent,
}: {
  day: EventDay;
  isCurrent: boolean;
}) {
  const headliners = day.djs.headliner ?? [];
  const support = day.djs.support ?? [];
  const hasDetails =
    Boolean(day.vibeText) ||
    headliners.length > 0 ||
    support.length > 0 ||
    (day.specials?.length ?? 0) > 0;

  return (
    <article
      className={`overflow-hidden rounded-[2rem] border bg-gradient-to-br ${day.accentClassName} shadow-lg`}
    >
      <details className="group" open={isCurrent || undefined}>
        <summary className="cursor-pointer list-none p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 sm:p-6">
          <div className="grid items-center gap-5 md:grid-cols-[150px_1fr_230px_auto]">
            <div className="rounded-2xl bg-black px-4 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                {day.weekday}
              </p>
              <p className="mt-2 text-2xl leading-none">{day.date}</p>
              {isCurrent && (
                <p className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
                  Heute
                </p>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-2xl font-cocogoose leading-tight text-black sm:text-3xl">
                {day.motto}
              </h3>
              <p className="mt-2 text-gray-700">{day.subtitle}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {day.highlights.slice(0, 4).map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full bg-black px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden min-w-0 md:block">
              {headliners.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Headliner
                  </p>
                  <p className="mt-2 truncate text-lg font-semibold text-black">
                    {headliners.map((dj) => dj.name).join(' · ')}
                  </p>
                </>
              )}
            </div>

            {hasDetails && (
              <div className="flex items-center justify-between gap-2 text-sm font-semibold md:justify-end">
                <span className="md:hidden">Details anzeigen</span>
                <ExpandMore className="transition-transform duration-300 group-open:rotate-180" />
              </div>
            )}
          </div>
        </summary>

        {hasDetails && (
          <div className="border-t border-black/10 px-4 pb-6 pt-6 sm:px-6 sm:pb-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <p className="max-w-3xl leading-relaxed text-gray-700">
                  {day.vibeText}
                </p>

                {headliners.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                      Headliner
                    </p>
                    <DjChips djs={headliners} />
                  </div>
                )}

                {support.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                      Support
                    </p>
                    <DjChips djs={support} />
                  </div>
                )}
              </div>

              {(day.specials?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                    Specials & Highlights
                  </p>
                  <SpecialsGrid specials={day.specials} />
                </div>
              )}
            </div>
          </div>
        )}
      </details>

      <div className="flex flex-col gap-4 border-t border-black/10 bg-white/45 px-4 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-gray-700">
          Eintritt frei. Mit Reservierung sicherst du deiner Gruppe einen festen
          Platz.
        </p>

        {day.reservationLink && (
          <Link
            href={day.reservationLink}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-black px-5 py-2.5 font-semibold text-white transition hover:bg-gray-800"
          >
            Reservieren
            <KeyboardArrowRight fontSize="small" />
          </Link>
        )}
      </div>
    </article>
  );
}

export default function EventDaysSection() {
  const [showAll, setShowAll] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const relevantIndex = useMemo(
    () => (now ? getRelevantEventDayIndex(eventDays, now) : 0),
    [now],
  );

  const visibleDays = useMemo(() => {
    if (showAll) return eventDays;

    const startIndex = Math.max(0, relevantIndex);
    const upcomingDays = eventDays.slice(startIndex, startIndex + 4);

    if (upcomingDays.length === 4) return upcomingDays;

    return eventDays.slice(Math.max(0, eventDays.length - 4));
  }, [relevantIndex, showAll]);

  const operationalDate = now ? getOperationalDate(now) : null;

  return (
    <section id="programm" className="scroll-mt-24 bg-[#f8f6f2] px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
            Programm 2026
          </p>
          <h2 className="text-4xl font-cocogoose text-black sm:text-5xl">
            Jeder Tag ein eigener Vibe.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-700">
            Zuerst siehst du den aktuellen und die nächsten Veranstaltungstage.
            Öffne eine Karte für Line-up, Specials und weitere Details.
          </p>
        </div>

        <div className="mt-12 space-y-5">
          {visibleDays.map((day) => {
            const parsedDate = parseEventDayDate(day.date);
            const isCurrent = Boolean(
              parsedDate &&
              operationalDate &&
              isSameCalendarDay(parsedDate, operationalDate),
            );

            return (
              <EventDayCard key={day.id} day={day} isCurrent={isCurrent} />
            );
          })}
        </div>

        {eventDays.length > 4 && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="rounded-full border border-black/15 bg-white px-7 py-3 font-semibold text-black shadow-sm transition hover:bg-stone-100"
            >
              {showAll
                ? 'Nur aktuelle & kommende Tage anzeigen'
                : `Alle ${eventDays.length} Veranstaltungstage anzeigen`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
