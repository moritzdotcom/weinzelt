import Link from 'next/link';
import {
  ArrowForwardRounded,
  CalendarMonthRounded,
  LocalActivityRounded,
  ScheduleRounded,
  WineBarRounded,
} from '@mui/icons-material';
import type { PublicSpecialEvent } from '@/lib/specialEvents';
import {
  formatSpecialEventCategory,
  formatSpecialEventPrice,
} from '@/lib/specialEvents';

function formatDate(eventDate: { date: string; dow?: string }) {
  if (eventDate.dow) {
    return `${eventDate.dow}, ${eventDate.date}`;
  }

  const parsedDate = new Date(eventDate.date);

  if (Number.isNaN(parsedDate.getTime())) {
    return eventDate.date;
  }

  return parsedDate.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

export function SpecialEventCard({
  event,
  onRegister,
  preview = false,
}: {
  event: PublicSpecialEvent;
  onRegister?: (event: PublicSpecialEvent) => void;
  preview?: boolean;
}) {
  const price = formatSpecialEventPrice(event);
  const category = formatSpecialEventCategory(event.category);

  const isInternalRegistration = event.bookingType === 'INTERNAL_REGISTRATION';

  const isExternalLink =
    event.bookingType === 'EXTERNAL_LINK' && Boolean(event.externalUrl);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden bg-stone-200">
        {event.titleImageUrl ? (
          <img
            src={event.titleImageUrl}
            alt={event.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-100 via-orange-50 to-rose-100">
            <WineBarRounded sx={{ fontSize: 64, opacity: 0.3 }} />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
            {category}
          </span>

          {event.badge && (
            <span className="rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-black shadow-sm backdrop-blur">
              {event.badge}
            </span>
          )}
        </div>

        {price && (
          <div className="absolute bottom-4 left-4 text-sm font-semibold text-white">
            {price}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarMonthRounded sx={{ fontSize: 16 }} />
            {formatDate(event.eventDate)}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <ScheduleRounded sx={{ fontSize: 16 }} />
            {event.startTime}–{event.endTime} Uhr
          </span>
        </div>

        <h3 className="mt-4 text-2xl font-cocogoose leading-tight text-black">
          {event.name}
        </h3>

        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-600">
          {event.description}
        </p>

        {event.remainingCapacity !== null && !event.isSoldOut && (
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <LocalActivityRounded sx={{ fontSize: 16 }} />
            Noch {event.remainingCapacity}{' '}
            {event.remainingCapacity === 1 ? 'Platz' : 'Plätze'} verfügbar
          </p>
        )}

        <div className="mt-auto pt-6">
          {event.isSoldOut ? (
            <div className="inline-flex w-full items-center justify-center rounded-full bg-stone-200 px-5 py-3 text-sm font-semibold text-gray-500">
              Ausgebucht
            </div>
          ) : isExternalLink ? (
            preview ? (
              <div className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
                {event.ctaLabel}
                <ArrowForwardRounded fontSize="small" />
              </div>
            ) : (
              <Link
                href={event.externalUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
              >
                {event.ctaLabel}
                <ArrowForwardRounded fontSize="small" />
              </Link>
            )
          ) : isInternalRegistration ? (
            <button
              type="button"
              disabled={preview}
              onClick={() => onRegister?.(event)}
              className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-default"
            >
              {event.ctaLabel}
              <ArrowForwardRounded fontSize="small" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
