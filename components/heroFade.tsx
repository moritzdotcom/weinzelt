'use client';

import { KeyboardArrowRight } from '@mui/icons-material';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const images = [
  {
    src: '/home/weinzelt1.jpg',
    alt: 'Gäste feiern gemeinsam im Weinzelt auf der Rheinkirmes',
  },
  {
    src: '/home/weinzelt2.jpg',
    alt: 'Ausgelassene Stimmung und Wein im Düsseldorfer Weinzelt',
  },
  {
    src: '/home/weinzelt3.jpg',
    alt: 'DJ und tanzende Gäste am Abend im Weinzelt',
  },
  {
    src: '/home/weinzelt4.jpg',
    alt: 'Wein, Musik und Kirmesatmosphäre im Weinzelt',
  },
  {
    src: '/home/weinzelt5.jpg',
    alt: 'Freunde genießen einen Veranstaltungstag im Weinzelt',
  },
];

export default function HeroFade() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[620px] overflow-hidden bg-black md:min-h-[720px] lg:min-h-[780px]">
      {images.map((image, imageIndex) => (
        <div
          key={image.src}
          aria-hidden={imageIndex !== index}
          className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out motion-reduce:transition-none ${
            imageIndex === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={image.src}
            alt={imageIndex === index ? image.alt : ''}
            fill
            priority={imageIndex === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/15" />

      <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center px-4 py-20 md:min-h-[720px] lg:min-h-[780px]">
        <div className="max-w-3xl text-white">
          <p className="mb-5 inline-flex rounded-full border border-white/25 bg-black/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur-md sm:text-sm">
            17.–26. Juli 2026 · Rheinkirmes Düsseldorf
          </p>

          <h1 className="max-w-3xl text-5xl font-cocogoose leading-[0.96] sm:text-6xl lg:text-7xl">
            Wein. Beats. Düsseldorf.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            Das Weinzelt verbindet ausgewählte Weine, gutes Essen und
            elektronische Musik mitten auf der Rheinkirmes.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 font-semibold text-black shadow-xl transition hover:bg-stone-200"
            >
              Jetzt reservieren
              <KeyboardArrowRight fontSize="small" />
            </Link>

            <Link
              href="/#programm"
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-black/20 px-7 py-4 font-semibold text-white backdrop-blur-md transition hover:bg-white hover:text-black"
            >
              Programm entdecken
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
            <span>Eintritt frei</span>
            <span aria-hidden="true">•</span>
            <span>Reservierung optional</span>
            <span aria-hidden="true">•</span>
            <span>WineEvents separat buchbar</span>
          </div>
        </div>
      </div>
    </section>
  );
}
