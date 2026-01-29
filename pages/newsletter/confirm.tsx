import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { useEffect } from 'react';
import prisma from '@/lib/prismadb';

type Props = {
  redirected?: boolean;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const idRaw = ctx.query.id;

  // Ensure id is a single string
  const id = typeof idRaw === 'string' ? idRaw : null;

  // No id -> redirect home
  if (!id) {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  // Find subscription
  const sub = await prisma.newsletterSubscription.findUnique({
    where: { id },
    select: { id: true, confirmed: true },
  });

  // Not found or already confirmed -> redirect home
  if (!sub || sub.confirmed) {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  // Confirm now
  await prisma.newsletterSubscription.update({
    where: { id },
    data: { confirmed: true },
  });

  return {
    props: {},
  };
};

export default function NewsletterConfirmPage(
  _props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = '/';
    }, 5000);

    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Head>
        <title>Newsletter bestätigt - Weinzelt</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 560,
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}
        >
          <img
            src="https://dasweinzelt.de/logo.png"
            alt="Weinzelt Logo"
            className="mx-auto"
            style={{ maxWidth: 180, height: 'auto', marginBottom: 16 }}
          />

          <h1 style={{ margin: '0 0 10px', fontSize: 24, color: '#111' }}>
            Anmeldung bestätigt ✅
          </h1>

          <p
            style={{ margin: 0, fontSize: 16, color: '#444', lineHeight: 1.5 }}
          >
            Danke! Du bist jetzt erfolgreich für unseren Newsletter angemeldet.
            <br />
            Du wirst gleich zur Startseite weitergeleitet…
          </p>

          <div style={{ marginTop: 18, fontSize: 12, color: '#777' }}>
            Falls nichts passiert,{' '}
            <a href="/" style={{ color: '#777', textDecoration: 'underline' }}>
              klicke hier
            </a>
            .
          </div>
        </div>
      </main>
    </>
  );
}
