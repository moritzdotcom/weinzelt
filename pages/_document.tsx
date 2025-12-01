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
        <meta
          name="keywords"
          content="Weinzelt, Düsseldorf, Rheinkirmes, Kirmes"
        />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="57x57"
          href="/icons/favicon-57x57.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="60x60"
          href="/icons/favicon-60x60.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="72x72"
          href="/icons/favicon-72x72.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href="/icons/favicon-76x76.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/icons/favicon-96x96.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href="/icons/favicon-114x114.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/icons/favicon-120x120.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="/icons/favicon-144x144.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/favicon-152x152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/favicon-180x180.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/icons/favicon-192x192.png"
        />

        <link rel="canonical" href="https://dasweinzelt.de/" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content={encodeURI('https://dasweinzelt.de/home/weinzelt2.jpg')}
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
          content={encodeURI('https://dasweinzelt.de/home/weinzelt2.jpg')}
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
