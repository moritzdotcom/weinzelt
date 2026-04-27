import { useEffect, useRef, useState } from 'react';
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
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const [loadedIds, setLoadedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!galleryRef.current || photos.length === 0) return;

    const lightbox = new PhotoSwipeLightbox({
      gallery: galleryRef.current,
      children: 'a',
      pswpModule: () => import('photoswipe'),
    });

    lightbox.init();

    return () => {
      lightbox.destroy();
    };
  }, [photos.length]);

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
        ref={galleryRef}
        id="impressions-gallery"
        className="columns-2 sm:columns-3 md:columns-4 gap-3"
      >
        {photos.map((photo, index) => {
          const isLoaded = loadedIds[photo.id];

          return (
            <a
              key={photo.id}
              href={photo.url}
              data-pswp-width={photo.width}
              data-pswp-height={photo.height}
              className="
                mb-3 block overflow-hidden rounded-lg group
                break-inside-avoid
                bg-neutral-100
                relative
              "
              style={{
                aspectRatio: `${photo.width} / ${photo.height}`,
              }}
            >
              <img
                src={photo.url}
                width={photo.width}
                height={photo.height}
                alt={`Weinzelt Impression ${year} ${day}`}
                loading={index < 8 ? 'eager' : 'lazy'}
                fetchPriority={index < 4 ? 'high' : 'auto'}
                decoding="async"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                onLoad={() => {
                  setLoadedIds((prev) => ({
                    ...prev,
                    [photo.id]: true,
                  }));
                }}
                className={`
                  w-full h-full object-cover
                  transition-all duration-500 ease-out
                  group-hover:scale-105
                  ${
                    isLoaded
                      ? 'opacity-100 blur-0 scale-100'
                      : 'opacity-0 blur-sm scale-[1.02]'
                  }
                `}
              />

              {!isLoaded && (
                <div className="absolute inset-0 animate-pulse bg-neutral-200" />
              )}

              <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
