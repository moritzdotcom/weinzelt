// pages/newsletter/unsubscribe.tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { useEffect } from 'react';
import prisma from '@/lib/prismadb';

type Props = {};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const idRaw = ctx.query.id;
  const id = typeof idRaw === 'string' ? idRaw : null;

  // Ohne id -> direkt nach Hause
  if (!id) {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  const sub = await prisma.newsletterSubscription.delete({
    where: { id },
    select: { id: true },
  });

  // Nicht gefunden -> nach Hause
  if (!sub) {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  return {
    props: {},
  };
};

export default function NewsletterUnsubscribePage() {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = '/';
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  const title = 'Du wurdest abgemeldet';

  const text = 'Schade! Du bist jetzt vom Weinzelt Newsletter abgemeldet.';

  return (
    <>
      <Head>
        <title>{title} - Weinzelt</title>
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
            style={{ maxWidth: 180, height: 'auto', marginBottom: 16 }}
          />

          <h1 style={{ margin: '0 0 10px', fontSize: 24, color: '#111' }}>
            {status === 'already_unsubscribed' ? 'Alles gut 👌' : 'Erledigt ✅'}
          </h1>

          <p
            style={{ margin: 0, fontSize: 16, color: '#444', lineHeight: 1.5 }}
          >
            <strong>{title}</strong>
            <br />
            {text}
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
