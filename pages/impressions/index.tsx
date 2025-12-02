import type { GetServerSideProps } from 'next';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import { Session } from '@/hooks/useSession';

type AlbumItem = {
  id: string;
  year: number;
  day: string;
  coverUrl: string | null;
};

type Photo = {
  id: string;
  url: string;
  day: string;
  width: number;
  height: number;
};

interface Props {
  albums: AlbumItem[];
  selectedAlbumId: string | null;
  selectedAlbumLabel: string | null;
  photos: Photo[];
  session: Session;
}

export const getServerSideProps: GetServerSideProps<Partial<Props>> = async (
  ctx
) => {
  // Alben laden
  const albumsRaw = await prisma.album.findMany({
    orderBy: [{ year: 'desc' }, { day: 'asc' }],
    include: {
      coverPhoto: true,
    },
  });

  const albums: AlbumItem[] = albumsRaw.map((album) => {
    let coverUrl: string | null = null;
    if (album.coverPhoto) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('Weinzelt').getPublicUrl(album.coverPhoto.path);
      coverUrl = publicUrl;
    }
    return {
      id: album.id,
      year: album.year,
      day: album.day,
      coverUrl,
    };
  });

  return {
    props: {
      albums,
    },
  };
};

export default function ImpressionenPage({ albums, session }: Props) {
  if (albums.length === 0) {
    return (
      <>
        <Navbar session={session} />
        <main className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-cocogoose mb-4">Bilder vom WEINZELT</h1>
          <p>Noch keine Fotos verfügbar.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar session={session} />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-cocogoose mb-6">Bilder vom WEINZELT</h1>

        {/* Album Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-10">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/impressions/${album.id}`}
              className="group rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={`${album.year} - ${album.day}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
                    Kein Cover
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{album.year}</p>
                  <p className="text-base font-semibold">{album.day}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
