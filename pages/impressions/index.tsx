import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import HtmlHead from '@/components/htmlHead';
import { Session } from '@/hooks/useSession';
import { formatPhotoCount, parseAlbumMeta } from '@/lib/impressionAlbumMeta';

type AlbumItem = {
  id: string;
  year: number;
  day: string;
  title: string;
  dateLabel: string;
  sortValue: number;
  coverUrl: string | null;
  photoCount: number;
};

interface Props {
  albums: AlbumItem[];
  session: Session;
}

export const getServerSideProps: GetServerSideProps<
  Partial<Props>
> = async () => {
  const albumsRaw = await prisma.album.findMany({
    include: {
      coverPhoto: true,
      _count: {
        select: {
          photos: true,
        },
      },
    },
  });

  const albums: AlbumItem[] = albumsRaw
    .map((album) => {
      const albumMeta = parseAlbumMeta(album.year, album.day);

      let coverUrl: string | null = null;

      if (album.coverPhoto) {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from('Weinzelt')
          .getPublicUrl(album.coverPhoto.path);

        coverUrl = publicUrl;
      }

      return {
        id: album.id,
        year: album.year,
        day: album.day,
        title: albumMeta.title,
        dateLabel: albumMeta.dateLabel,
        sortValue: albumMeta.sortValue,
        coverUrl,
        photoCount: album._count.photos,
      };
    })
    .sort((a, b) => {
      if (a.sortValue !== b.sortValue) {
        return b.sortValue - a.sortValue;
      }

      return a.title.localeCompare(b.title, 'de-DE');
    });

  return {
    props: {
      albums,
    },
  };
};

function AlbumCover({
  album,
  priority = false,
  className = '',
}: {
  album: AlbumItem;
  priority?: boolean;
  className?: string;
}) {
  if (!album.coverUrl) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-stone-200 ${className}`}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <img
            src="/logo-sm.png"
            alt=""
            className="w-32 opacity-30 grayscale"
          />

          <p className="text-sm font-medium text-stone-500">
            Noch kein Cover ausgewählt
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={album.coverUrl}
      alt={`Impressionen aus dem Album ${album.title}`}
      loading={priority ? 'eager' : 'lazy'}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

function FeaturedAlbum({ album }: { album: AlbumItem }) {
  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:-mt-16">
      <Link
        href={`/impressions/${album.id}`}
        className="group grid overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-2xl md:grid-cols-[1.45fr_1fr]"
      >
        <div className="relative min-h-[320px] overflow-hidden bg-stone-200 sm:min-h-[420px]">
          <AlbumCover
            album={album}
            priority
            className="transition-transform duration-700 ease-out group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/5" />

          <span className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-black shadow-md">
            Neueste Galerie
          </span>

          <div className="absolute bottom-5 left-5 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            {formatPhotoCount(album.photoCount)}
          </div>
        </div>

        <div className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            {album.dateLabel}
          </p>

          <h2 className="mt-4 text-3xl font-cocogoose leading-tight text-black sm:text-4xl">
            {album.title}
          </h2>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
            Die neuesten Bilder aus dem Weinzelt sind online. Entdecke die
            schönsten Momente, bekannte Gesichter und die Stimmung des Tages.
          </p>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-black/10 pt-6">
            <span className="font-semibold text-black">Album ansehen</span>

            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl text-white transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}

function AlbumCard({ album }: { album: AlbumItem }) {
  return (
    <Link
      href={`/impressions/${album.id}`}
      className="group block focus:outline-none"
    >
      <article>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-stone-200">
          <AlbumCover
            album={album}
            className="transition-transform duration-700 ease-out group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
            <p className="text-sm font-medium">
              {formatPhotoCount(album.photoCount)}
            </p>

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg text-black shadow-md transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>

        <div className="px-1 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            {album.dateLabel}
          </p>

          <h3 className="mt-2 text-xl font-semibold leading-tight text-black transition-colors group-hover:text-gray-600">
            {album.title}
          </h3>
        </div>
      </article>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-stone-50 px-6 py-16 text-center">
      <img
        src="/logo-sm.png"
        alt=""
        className="mx-auto mb-6 w-40 opacity-30 grayscale"
      />

      <h2 className="text-2xl font-cocogoose text-black">
        Noch keine Fotos verfügbar
      </h2>

      <p className="mx-auto mt-3 max-w-xl leading-relaxed text-gray-600">
        Sobald die ersten Bilder aus dem Weinzelt online sind, findest du sie
        hier.
      </p>

      <Link
        href="/"
        className="mt-7 inline-flex items-center justify-center rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
      >
        Zurück zur Startseite
      </Link>
    </div>
  );
}

export default function ImpressionenPage({ albums, session }: Props) {
  const featuredAlbum = albums[0] ?? null;

  const albumsByYear = albums.reduce<Record<number, AlbumItem[]>>(
    (result, album) => {
      if (!result[album.year]) {
        result[album.year] = [];
      }

      result[album.year].push(album);

      return result;
    },
    {},
  );

  const years = Object.keys(albumsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-white font-sans">
      <HtmlHead />
      <Navbar session={session} />

      <main>
        <section className="relative overflow-hidden bg-stone-950 px-4 pb-24 pt-20 text-white sm:pb-32 sm:pt-28">
          {featuredAlbum?.coverUrl && (
            <>
              <div className="absolute inset-0">
                <img
                  src={featuredAlbum.coverUrl}
                  alt=""
                  className="h-full w-full scale-110 object-cover opacity-25 blur-sm"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-black via-stone-950/20 to-black/5" />
            </>
          )}

          <div className="relative mx-auto max-w-7xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
              Impressionen
            </p>

            <h1 className="max-w-4xl text-4xl font-cocogoose leading-tight sm:text-6xl md:text-7xl">
              Momente, die bleiben.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
              Wein, Beats, besondere Begegnungen und lange Nächte auf der
              Rheinkirmes - entdecke die schönsten Momente aus dem Weinzelt.
            </p>

            {albums.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
                  {albums.length} {albums.length === 1 ? 'Album' : 'Alben'}
                </span>

                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
                  {years.length} {years.length === 1 ? 'Jahrgang' : 'Jahrgänge'}
                </span>
              </div>
            )}
          </div>
        </section>

        {featuredAlbum ? (
          <>
            <FeaturedAlbum album={featuredAlbum} />

            <section className="px-4 py-20 sm:py-28">
              <div className="mx-auto max-w-7xl">
                <div className="max-w-3xl">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Alle Galerien
                  </p>

                  <h2 className="text-4xl font-cocogoose leading-tight text-black sm:text-5xl">
                    Das Weinzelt in Bildern.
                  </h2>

                  <p className="mt-5 text-lg leading-relaxed text-gray-600">
                    Stöbere durch die vergangenen Veranstaltungstage und
                    entdecke deine persönlichen Weinzelt-Momente.
                  </p>
                </div>

                <div className="mt-16 space-y-20">
                  {years.map((year) => {
                    /*
                     * Das hervorgehobene Album wird unten nicht noch einmal
                     * doppelt angezeigt.
                     */
                    const yearAlbums = albumsByYear[year].filter(
                      (album) => album.id !== featuredAlbum.id,
                    );

                    if (yearAlbums.length === 0) {
                      return null;
                    }

                    return (
                      <section key={year}>
                        <div className="mb-8 flex items-end justify-between gap-5 border-b border-black/10 pb-5">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
                              Rheinkirmes
                            </p>

                            <h2 className="mt-1 text-4xl text-black">{year}</h2>
                          </div>

                          <p className="text-sm text-gray-500">
                            {yearAlbums.length}{' '}
                            {yearAlbums.length === 1 ? 'Album' : 'Alben'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {yearAlbums.map((album) => (
                            <AlbumCard key={album.id} album={album} />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="bg-stone-100 px-4 py-20">
              <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-black px-7 py-10 text-white sm:px-10 md:flex-row md:items-center md:py-12">
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
                  <span className="ml-2">→</span>
                </Link>
              </div>
            </section>
          </>
        ) : (
          <section className="px-4 py-20">
            <div className="mx-auto max-w-7xl">
              <EmptyState />
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
