import type { GetServerSideProps } from 'next';
import prisma from '@/lib/prismadb';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Gallery from '@/components/gallery';
import Navbar from '@/components/navbar';
import { Session } from '@/hooks/useSession';

type Photo = {
  id: string;
  url: string;
  day: string;
  width: number;
  height: number;
};

interface Props {
  year: number;
  day: string;
  photos: Photo[];
  session: Session;
}

export const getServerSideProps: GetServerSideProps<Partial<Props>> = async (
  ctx
) => {
  const queryAlbumId = ctx.query.albumId as string;

  const album = await prisma.album.findFirst({
    where: { id: queryAlbumId },
  });

  if (!album) {
    return {
      redirect: {
        destination: '/impressions',
        permanent: false,
      },
    };
  }

  const photosRaw = await prisma.impressionPhoto.findMany({
    where: { albumId: queryAlbumId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const photos: Photo[] = photosRaw.map((photo) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from('Weinzelt').getPublicUrl(photo.path);

    return {
      id: photo.id,
      url: publicUrl,
      day: album.day,
      width: photo.width ?? 1600,
      height: photo.height ?? 900,
    };
  });

  return {
    props: {
      year: album.year,
      day: album.day,
      photos,
    },
  };
};

export default function ImpressionenPage({
  year,
  day,
  photos,
  session,
}: Props) {
  return (
    <>
      <Navbar session={session} />
      <main className="px-4 py-10">
        <Link
          href="/impressions"
          className="inline-block mb-3 text-black hover:underline"
        >
          &larr; Zurück zur Albumübersicht
        </Link>
        <h1 className="text-3xl font-bold mb-3 text-center">{`${year} - ${day}`}</h1>

        {/* Album Grid */}
        <Gallery photos={photos} year={year} day={day} />
      </main>
    </>
  );
}
