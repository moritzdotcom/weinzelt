import LocalBusiness from '@/components/localBusiness';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>
          Weinzelt - Dein Platz für Wein, Beats & echtes Düsseldorf-Feeling
        </title>
        <meta
          name="description"
          content="Erlebe das Weinzelt auf der Rheinkirmes Düsseldorf: Exklusive Weinverkostungen, House-Beats & entspanntes Zeltflair. Wir freuen uns auf euch!"
        />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="canonical" href="https://dasweinzelt.de/" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content={encodeURI('https://dasweinzelt.de/home/weinzelt-og.jpg')}
        />
        <meta name="twitter:url" content="https://dasweinzelt.de/" />
        <meta
          name="twitter:title"
          content="Weinzelt - Wein. Beats. Düsseldorf."
        />
        <meta
          name="twitter:description"
          content="Das Weinzelt auf der Düsseldorfer Rheinkirmes - Wine meets Rheinkirmes"
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content={encodeURI('https://dasweinzelt.de/home/weinzelt-og.jpg')}
        />
        <meta
          property="og:title"
          content="Weinzelt - Wein. Beats. Düsseldorf."
        />
        <meta
          property="og:description"
          content="Das Weinzelt auf der Düsseldorfer Rheinkirmes - Wine meets Rheinkirmes"
        />
        <meta property="og:site_name" content="Weinzelt" />
        <meta property="og:url" content="https://dasweinzelt.de/" />
        <LocalBusiness />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
