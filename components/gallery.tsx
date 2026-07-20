import { useEffect, useRef, useState } from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';

export interface GalleryPhoto {
  id: string;
  fullUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

function GalleryPhotoItem({
  photo,
  index,
  total,
  title,
}: {
  photo: GalleryPhoto;
  index: number;
  total: number;
  title: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <a
      href={photo.fullUrl}
      data-pswp-width={photo.width}
      data-pswp-height={photo.height}
      aria-label={`Foto ${index + 1} von ${total} aus dem Album ${title}`}
      className="group relative mb-3 block break-inside-avoid overflow-hidden rounded-2xl bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:mb-4"
      style={{
        aspectRatio: `${photo.width} / ${photo.height}`,
      }}
    >
      <img
        src={photo.thumbnailUrl}
        width={photo.width}
        height={photo.height}
        alt={`${title}, Foto ${index + 1}`}
        loading={index === 0 ? 'eager' : 'lazy'}
        fetchPriority={index === 0 ? 'high' : 'auto'}
        decoding="async"
        sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.025] ${
          loaded
            ? 'scale-100 opacity-100 blur-0'
            : 'scale-[1.02] opacity-0 blur-sm'
        }`}
      />

      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse bg-stone-200"
          aria-hidden="true"
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/95 text-lg text-black opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        aria-hidden="true"
      >
        +
      </div>
    </a>
  );
}

export default function Gallery({
  photos,
  year,
  day,
  title,
}: {
  photos: GalleryPhoto[];
  year: number;
  day: string;
  title: string;
}) {
  const galleryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!galleryRef.current || photos.length === 0) return;

    const lightbox = new PhotoSwipeLightbox({
      gallery: galleryRef.current,
      children: 'a',
      pswpModule: () => import('photoswipe'),
      wheelToZoom: true,
      preload: [1, 2],
      showHideAnimationType: 'fade',
      bgOpacity: 0.95,
    });

    lightbox.init();

    return () => {
      lightbox.destroy();
    };
  }, [photos]);

  if (photos.length === 0) {
    return (
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-black/10 bg-stone-50 px-6 py-16 text-center">
          <img
            src="/logo-sm.png"
            alt=""
            className="mx-auto mb-6 w-40 opacity-30 grayscale"
          />

          <h2 className="text-2xl font-cocogoose text-black">
            Noch keine Impressionen
          </h2>

          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-gray-600">
            Für {year} - {day} wurden noch keine Fotos veröffentlicht.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pb-20 pt-8 sm:pb-28 sm:pt-10">
      <div
        ref={galleryRef}
        id="impressions-gallery"
        className="mx-auto max-w-[1600px] columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 xl:columns-5"
      >
        {photos.map((photo, index) => (
          <GalleryPhotoItem
            key={photo.id}
            photo={photo}
            index={index}
            total={photos.length}
            title={title}
          />
        ))}
      </div>
    </section>
  );
}
