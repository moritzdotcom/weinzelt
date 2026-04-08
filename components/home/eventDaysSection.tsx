import Link from 'next/link';
import { Divider } from '@mui/material';
import { KeyboardArrowRight } from '@mui/icons-material';
import { EventDay, eventDays } from '@/lib/events';

function DayBadge({ weekday, date }: { weekday: string; date: string }) {
  return (
    <div className="w-full md:w-46 md:min-w-46">
      <div className="sticky top-24 rounded-3xl border border-black/10 bg-black text-white px-5 py-5 shadow-lg flex md:flex-col gap-2 justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-white/70">
          {weekday}
        </p>
        <p className="text-xl md:text-3xl leading-none">{date}</p>
      </div>
    </div>
  );
}

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

function DjChips({
  djs,
}: {
  djs: Array<{
    name: string;
    genre?: string;
    instagramUrl?: string;
  }>;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {djs.map((dj) => (
        <div
          key={dj.name}
          className="flex items-center gap-3 rounded-full border border-black/10 bg-white/80 px-4 py-2 shadow-sm backdrop-blur transition hover:bg-white"
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
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition hover:bg-black hover:text-white"
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
      {specials.map((special, index) => (
        <div
          key={`${special.title}-${special.time ?? 'no-time'}-${index}`}
          className="flex h-full flex-col rounded-3xl border border-black/10 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {special.time && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {special.time} Uhr
                </p>
              )}
            </div>

            {special.badge && (
              <span className="shrink-0 rounded-full border border-black/10 bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                {special.badge}
              </span>
            )}
          </div>
          <h4 className="text-lg font-semibold leading-tight text-black">
            {special.title}
          </h4>

          <Divider sx={{ my: 1.5, mr: 2 }} />

          <p className="text-sm leading-relaxed text-gray-600">
            {special.description}
          </p>

          {special.link && special.ctaLabel && (
            <div className="mt-auto pt-4">
              <Link
                href={special.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-black underline underline-offset-4"
              >
                {special.ctaLabel}
                <KeyboardArrowRight fontSize="inherit" />
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Highlights({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-black px-3 py-1 text-xs font-medium uppercase tracking-wide text-white"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function EventDayCard({ day }: { day: EventDay }) {
  const hasDjs =
    (day.djs.support?.length ?? 0) > 0 || (day.djs.headliner?.length ?? 0) > 0;

  const hasSpecials = (day.specials?.length ?? 0) > 0;

  return (
    <article
      className={`rounded-[2rem] border bg-gradient-to-br ${day.accentClassName} p-4 sm:p-6 md:p-8 shadow-xl`}
    >
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <DayBadge weekday={day.weekday} date={day.date} />

        <div className="min-w-0 flex-1">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="min-w-0">
              <h3 className="text-3xl sm:text-4xl font-cocogoose leading-tight text-black">
                {day.motto}
              </h3>
              <p className="mt-3 text-lg font-medium text-gray-700">
                {day.subtitle}
              </p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-700">
                {day.vibeText}
              </p>

              <div className="mt-6">
                <Highlights items={day.highlights} />
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-black/10 shadow-md h-64 hidden md:block">
              <img
                src={day.image}
                alt={day.motto}
                className="h-64 w-full object-cover"
              />
            </div>
          </div>

          {(hasDjs || hasSpecials) && (
            <div
              className={`mt-8 grid gap-8 ${
                hasDjs && hasSpecials
                  ? 'lg:grid-cols-[1fr_1.2fr]'
                  : 'grid-cols-1'
              }`}
            >
              {hasDjs && (
                <div>
                  {day.djs.headliner?.length ? (
                    <div className="mb-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                        Headliner
                      </p>
                      <DjChips djs={day.djs.headliner} />
                    </div>
                  ) : null}

                  {day.djs.support?.length ? (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                        Support
                      </p>
                      <DjChips djs={day.djs.support} />
                    </div>
                  ) : null}
                </div>
              )}

              {hasSpecials && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                    Specials & Highlights
                  </p>
                  <SpecialsGrid specials={day.specials} />
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-black">
                Bereit für {day.motto}?
              </p>
              <p className="text-sm text-gray-600">
                Sichere dir deinen Platz im Weinzelt.
              </p>
            </div>

            {day.reservationLink && (
              <Link
                href={day.reservationLink}
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-white shadow-md transition hover:bg-gray-800"
              >
                Jetzt reservieren
                <KeyboardArrowRight fontSize="inherit" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function EventDaysSection() {
  return (
    <section id="programm" className="bg-[#f8f6f2] py-20 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
            Programm 2026
          </p>
          <h2 className="text-4xl sm:text-5xl font-cocogoose text-black">
            Jeder Tag ein eigener Vibe.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-700">
            Von entspanntem Daydrinking bis zu Nächten mit Beats, Licht und
            richtig guter Stimmung: Hier siehst du, was dich an den einzelnen
            Tagen im Weinzelt erwartet.
          </p>
        </div>

        <div className="mt-14 space-y-8">
          {eventDays.map((day) => (
            <EventDayCard key={day.id} day={day} />
          ))}
        </div>
      </div>
    </section>
  );
}
