import Link from 'next/link';
import { useEffect, useState } from 'react';
import Countdown from '@/components/countdown';
import { WEINZELT_END, WEINZELT_OPENING } from '@/lib/weinzeltDates';

export default function EventStatusSection() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    updateNow();

    const interval = window.setInterval(updateNow, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const opening = new Date(WEINZELT_OPENING).getTime();
  const end = new Date(WEINZELT_END).getTime();

  return (
    <section className="bg-gradient-to-br from-stone-100 to-stone-200 px-4 py-20 text-center text-black">
      <div className="mx-auto flex max-w-4xl flex-col items-center">
        <img src="/logo.png" alt="Weinzelt" className="mb-7 h-auto w-64" />

        {now === null ? null : now < opening ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gray-500">
              Opening am 17. Juli 2026
            </p>
            <h2 className="mt-3 text-3xl font-cocogoose sm:text-4xl">
              Bald wird wieder eingeschenkt.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-gray-700">
              Wein, Beats und beste Stimmung - wir sehen uns auf der
              Rheinkirmes.
            </p>
            <div className="mt-8">
              <Countdown targetDate={WEINZELT_OPENING} />
            </div>
          </>
        ) : now <= end ? (
          <>
            <p className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-green-800">
              Das Weinzelt läuft
            </p>
            <h2 className="mt-5 text-3xl font-cocogoose sm:text-5xl">
              Wir haben geöffnet.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-gray-700">
              Schau dir das heutige Programm an oder sichere dir für einen der
              kommenden Tage noch einen Tisch.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/#programm"
                className="rounded-full border border-black/15 bg-white px-6 py-3 font-semibold transition hover:bg-stone-100"
              >
                Heutiges Programm
              </Link>
              <Link
                href="/reservation"
                className="rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
              >
                Verfügbarkeit prüfen
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gray-500">
              Weinzelt 2026
            </p>
            <h2 className="mt-3 text-3xl font-cocogoose sm:text-4xl">
              Danke für zehn besondere Tage.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-gray-700">
              Trag dich in den Newsletter ein und erfahre zuerst, wie es mit dem
              Weinzelt weitergeht.
            </p>
            <Link
              href="/#newsletter"
              className="mt-8 rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
            >
              Newsletter abonnieren
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
