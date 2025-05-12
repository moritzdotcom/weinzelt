import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>Weinzelt</title>
        <meta
          name="description"
          content="Das Weinzelt auf der Düsseldorfer Rheinkirmes - Wine meets Rheinkirmes"
        />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" />

        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:image"
          content={encodeURI('https://dasweinzelt.de/home/logo-sm.png')}
        />
        <meta name="twitter:url" content="https://dasweinzelt.de" />
        <meta name="twitter:title" content="Weinzelt" />
        <meta
          name="twitter:description"
          content="Das Weinzelt auf der Düsseldorfer Rheinkirmes - Wine meets Rheinkirmes"
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content={encodeURI('https://dasweinzelt.de/home/logo-sm.png')}
        />
        <meta property="og:title" content="Weinzelt" />
        <meta
          property="og:description"
          content="Das Weinzelt auf der Düsseldorfer Rheinkirmes - Wine meets Rheinkirmes"
        />
        <meta property="og:site_name" content="Weinzelt" />
        <meta property="og:url" content="https://dasweinzelt.de" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
