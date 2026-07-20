import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';
import { formatPhotoCount, parseAlbumMeta } from '@/lib/impressionAlbumMeta';
import Gallery, { type GalleryPhoto } from '@/components/gallery';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import type { Session } from '@/hooks/useSession';

type AlbumNavigationItem = {
  id: string;
  title: string;
  dateLabel: string;
  coverUrl: string | null;
};

interface Props {
  year: number;
  day: string;
  title: string;
  dateLabel: string;
  coverUrl: string | null;
  photos: GalleryPhoto[];
  previousAlbum: AlbumNavigationItem | null;
  nextAlbum: AlbumNavigationItem | null;
  session: Session;
}

function getStorageImageUrls(path: string) {
  const storage = supabase.storage.from('Weinzelt');

  const {
    data: { publicUrl: fullUrl },
  } = storage.getPublicUrl(path);

  /*
   * Supabase Image Transformations sind optional.
   * Aktivieren: SUPABASE_IMAGE_TRANSFORMATIONS=true
   */
  if (process.env.SUPABASE_IMAGE_TRANSFORMATIONS !== 'true') {
    return {
      fullUrl,
      thumbnailUrl: fullUrl,
    };
  }

  const {
    data: { publicUrl: thumbnailUrl },
  } = storage.getPublicUrl(path, {
    transform: {
      width: 1000,
      quality: 78,
      resize: 'contain',
    },
  });

  return {
    fullUrl,
    thumbnailUrl,
  };
}

function getPublicUrl(path?: string | null) {
  if (!path) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from('Weinzelt').getPublicUrl(path);

  return publicUrl;
}

export const getServerSideProps: GetServerSideProps<Partial<Props>> = async (
  ctx,
) => {
  const queryAlbumId = ctx.query.albumId;

  if (typeof queryAlbumId !== 'string') {
    return {
      redirect: {
        destination: '/impressions',
        permanent: false,
      },
    };
  }

  const [album, photosRaw, albumsRaw] = await Promise.all([
    prisma.album.findUnique({
      where: {
        id: queryAlbumId,
      },
      include: {
        coverPhoto: true,
      },
    }),

    prisma.impressionPhoto.findMany({
      where: {
        albumId: queryAlbumId,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),

    prisma.album.findMany({
      include: {
        coverPhoto: true,
      },
    }),
  ]);

  if (!album) {
    return {
      redirect: {
        destination: '/impressions',
        permanent: false,
      },
    };
  }

  const albumMeta = parseAlbumMeta(album.year, album.day);

  const photos: GalleryPhoto[] = photosRaw.map((photo) => {
    const { fullUrl, thumbnailUrl } = getStorageImageUrls(photo.path);

    return {
      id: photo.id,
      fullUrl,
      thumbnailUrl,
      width: photo.width ?? 1600,
      height: photo.height ?? 900,
    };
  });

  const sortedAlbums = albumsRaw
    .map((item) => {
      const meta = parseAlbumMeta(item.year, item.day);

      return {
        id: item.id,
        title: meta.title,
        dateLabel: meta.dateLabel,
        sortValue: meta.sortValue,
        coverUrl: getPublicUrl(item.coverPhoto?.path),
      };
    })
    .sort((a, b) => {
      if (a.sortValue !== b.sortValue) {
        return b.sortValue - a.sortValue;
      }

      return a.title.localeCompare(b.title, 'de-DE');
    });

  const currentAlbumIndex = sortedAlbums.findIndex(
    (item) => item.id === queryAlbumId,
  );

  /*
   * Die Liste ist vom neuesten zum ältesten Album sortiert.
   * previousAlbum führt chronologisch zurück, nextAlbum nach vorne.
   */
  const previousAlbum =
    currentAlbumIndex >= 0
      ? (sortedAlbums[currentAlbumIndex + 1] ?? null)
      : null;

  const nextAlbum =
    currentAlbumIndex > 0
      ? (sortedAlbums[currentAlbumIndex - 1] ?? null)
      : null;

  const coverUrl =
    getPublicUrl(album.coverPhoto?.path) ?? photos[0]?.fullUrl ?? null;

  return {
    props: {
      year: album.year,
      day: album.day,
      title: albumMeta.title,
      dateLabel: albumMeta.dateLabel,
      coverUrl,
      photos,
      previousAlbum,
      nextAlbum,
    },
  };
};

function AlbumNavigationCard({
  album,
  direction,
}: {
  album: AlbumNavigationItem;
  direction: 'previous' | 'next';
}) {
  const isNext = direction === 'next';

  return (
    <Link
      href={`/impressions/${album.id}`}
      className={`group relative min-h-[220px] overflow-hidden rounded-[2rem] ${
        isNext
          ? 'bg-black text-white'
          : 'border border-black/10 bg-white text-black'
      }`}
    >
      {album.coverUrl && (
        <>
          <img
            src={album.coverUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-25 transition-transform duration-700 group-hover:scale-105"
          />
          <div
            className={`absolute inset-0 ${
              isNext
                ? 'bg-gradient-to-r from-black/95 via-black/75 to-black/45'
                : 'bg-gradient-to-r from-white via-white/90 to-white/55'
            }`}
          />
        </>
      )}

      <div className="relative flex h-full min-h-[220px] flex-col justify-between p-6 sm:p-8">
        <p
          className={`text-xs font-semibold uppercase tracking-[0.22em] ${
            isNext ? 'text-white/55' : 'text-gray-500'
          }`}
        >
          {isNext ? 'Nächstes Album' : 'Vorheriges Album'}
        </p>

        <div className="mt-10">
          <p
            className={`text-sm ${isNext ? 'text-white/65' : 'text-gray-500'}`}
          >
            {album.dateLabel}
          </p>

          <div className="mt-2 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {album.title}
            </h2>

            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition-transform duration-300 ${
                isNext
                  ? 'bg-white text-black group-hover:translate-x-1'
                  : 'bg-black text-white group-hover:-translate-x-1'
              }`}
            >
              {isNext ? '→' : '←'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ImpressionenAlbumPage({
  year,
  day,
  title,
  dateLabel,
  coverUrl,
  photos,
  previousAlbum,
  nextAlbum,
  session,
}: Props) {
  const pageTitle = `${title} - Impressionen | Weinzelt Düsseldorf`;
  const description =
    photos.length > 0
      ? `Entdecke ${formatPhotoCount(photos.length)} vom ${dateLabel} im Weinzelt auf der Rheinkirmes Düsseldorf.`
      : `Entdecke die Impressionen vom ${dateLabel} im Weinzelt auf der Rheinkirmes Düsseldorf.`;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        {coverUrl && <meta property="og:image" content={coverUrl} />}
      </Head>

      <Navbar session={session} />

      <main>
        <section className="relative overflow-hidden bg-stone-950 px-4 py-16 text-white sm:py-24">
          {coverUrl && (
            <>
              <div className="absolute inset-0">
                <img
                  src={coverUrl}
                  alt=""
                  className="h-full w-full scale-105 object-cover opacity-35"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-black via-stone-950/90 to-black/55" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
            </>
          )}

          <div className="relative mx-auto max-w-7xl">
            <Link
              href="/impressions"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Alle Alben
            </Link>

            <p className="mt-10 text-sm font-semibold uppercase tracking-[0.32em] text-white/50">
              Impressionen · {year}
            </p>

            <h1 className="mt-4 max-w-5xl text-4xl font-cocogoose leading-tight sm:text-6xl md:text-7xl">
              {title}
            </h1>

            <div className="mt-7 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur-sm">
                {dateLabel}
              </span>

              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur-sm">
                {formatPhotoCount(photos.length)}
              </span>
            </div>
          </div>
        </section>

        <section className="px-4 pt-14 sm:pt-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 border-b border-black/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
                  Galerie
                </p>

                <h2 className="mt-2 text-3xl font-cocogoose leading-tight text-black sm:text-4xl">
                  Die schönsten Momente.
                </h2>
              </div>

              {photos.length > 0 && (
                <p className="text-sm text-gray-500">
                  Foto anklicken, um die Galerie zu öffnen
                </p>
              )}
            </div>
          </div>
        </section>

        <Gallery photos={photos} year={year} day={day} title={title} />

        {(previousAlbum || nextAlbum) && (
          <section className="border-t border-black/10 bg-stone-100 px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-7xl">
              <p className="mb-7 text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
                Weitere Impressionen
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                {previousAlbum ? (
                  <AlbumNavigationCard
                    album={previousAlbum}
                    direction="previous"
                  />
                ) : (
                  <div className="hidden md:block" />
                )}

                {nextAlbum && (
                  <AlbumNavigationCard album={nextAlbum} direction="next" />
                )}
              </div>
            </div>
          </section>
        )}

        <section className="bg-stone-100 px-4 pb-20">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-black px-7 py-10 text-white sm:px-10 md:flex-row md:items-center md:py-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
                Noch mehr Weinzelt
              </p>

              <h2 className="mt-3 text-3xl font-cocogoose sm:text-4xl">
                Folge uns auf Instagram.
              </h2>

              <p className="mt-3 max-w-xl leading-relaxed text-white/65">
                Aktuelle Eindrücke, neue Events und alles, was rund um das
                Weinzelt passiert.
              </p>
            </div>

            <Link
              href="https://www.instagram.com/weinzelt.dus/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-stone-200"
            >
              Zu Instagram
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
