import { KeyboardArrowRight } from '@mui/icons-material';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { eventDays } from '@/lib/events';
import {
  getOperationalDate,
  getRelevantEventDayIndex,
  isSameCalendarDay,
  parseEventDayDate,
} from '@/lib/weinzeltDates';

export default function TodaySection() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateNow = () => setNow(new Date());
    updateNow();

    const interval = window.setInterval(updateNow, 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const state = useMemo(() => {
    if (!now || eventDays.length === 0) return null;

    const relevantIndex = getRelevantEventDayIndex(eventDays, now);
    if (relevantIndex < 0) return null;

    const day = eventDays[relevantIndex];
    const parsedDate = parseEventDayDate(day.date);
    if (!parsedDate) return null;

    const operationalDate = getOperationalDate(now);
    const isToday = isSameCalendarDay(parsedDate, operationalDate);
    const isPast = parsedDate.getTime() < new Date(
      operationalDate.getFullYear(),
      operationalDate.getMonth(),
      operationalDate.getDate(),
      12,
    ).getTime();

    if (isPast && relevantIndex === eventDays.length - 1 && !isToday) {
      return null;
    }

    return {
      day,
      isToday,
    };
  }, [now]);

  if (!state) return null;

  const { day, isToday } = state;
  const headliners = day.djs.headliner?.map((dj) => dj.name) ?? [];

  return (
    <section className="relative z-10 -mt-10 px-4">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-2xl md:grid-cols-[1.35fr_0.65fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
            {isToday ? 'Heute im Weinzelt' : 'Als Nächstes im Weinzelt'}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-cocogoose leading-tight text-black sm:text-4xl">
              {day.motto}
            </h2>
            <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {day.weekday}, {day.date}
            </span>
          </div>

          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            {day.subtitle}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {headliners.slice(0, 3).map((name) => (
              <span
                key={name}
                className="rounded-full border border-black/10 bg-stone-100 px-3 py-1.5 text-sm font-medium"
              >
                {name}
              </span>
            ))}
            {day.highlights.slice(0, 3).map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-black/10 px-3 py-1.5 text-sm text-gray-700"
              >
                {highlight}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {day.reservationLink && (
              <Link
                href={day.reservationLink}
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
              >
                Für diesen Tag reservieren
                <KeyboardArrowRight fontSize="small" />
              </Link>
            )}

            <Link
              href="/#programm"
              className="inline-flex items-center justify-center rounded-full border border-black/15 px-6 py-3 font-semibold text-black transition hover:bg-stone-100"
            >
              Details & Programm
            </Link>
          </div>
        </div>

        <div className="relative min-h-64 md:min-h-full">
          <img
            src={day.image}
            alt={`${day.motto} im Weinzelt`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent md:bg-gradient-to-l" />
        </div>
      </div>
    </section>
  );
}
