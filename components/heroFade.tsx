'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function HeroFade() {
  const images = [
    '/home/weinzelt1.jpg',
    '/home/weinzelt2.jpg',
    '/home/weinzelt3.jpg',
    '/home/weinzelt4.jpg',
    '/home/weinzelt5.jpg',
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 4000); // alle 4 Sekunden

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[45vh] sm:h-[70vh] overflow-hidden">
      {images.map((src, i) => (
        <div
          key={src}
          className={`
            absolute inset-0 transition-opacity duration-[2000ms] ease-in-out
            ${i === index ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <Image
            src={src}
            alt="Weinzelt Hero"
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      {/* Optional: dunkler Overlay für bessere Lesbarkeit */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </section>
  );
}
