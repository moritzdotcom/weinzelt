import { useEffect } from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';

interface Photo {
  id: string;
  url: string;
  day: string;
  width: number;
  height: number;
}

export default function Gallery({
  photos,
  year,
  day,
}: {
  photos: Photo[];
  year: number;
  day: string;
}) {
  useEffect(() => {
    if (!photos || photos.length === 0) return;

    const lightbox = new PhotoSwipeLightbox({
      gallery: '#impressions-gallery',
      children: 'a',
      pswpModule: () => import('photoswipe'),
    });

    lightbox.init();

    return () => {
      lightbox.destroy();
    };
  }, [photos]);

  if (photos.length === 0) {
    return (
      <p className="text-center py-8">
        Noch keine Impressionen für {year} - {day}.
      </p>
    );
  }

  return (
    <section className="py-6">
      <div
        id="impressions-gallery"
        // Masonry über CSS Columns
        className="columns-2 sm:columns-3 md:columns-4 gap-3"
      >
        {photos.map((photo) => (
          <a
            key={photo.id}
            href={photo.url}
            data-pswp-width={photo.width}
            data-pswp-height={photo.height}
            className="
              mb-3 block overflow-hidden rounded-lg group
              break-inside-avoid
            "
          >
            <img
              src={photo.url}
              alt={`Weinzelt Impression ${year} ${day}`}
              loading="lazy"
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
