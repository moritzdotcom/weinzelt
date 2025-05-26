import Head from 'next/head';

export default function Imprint() {
  return (
    <>
      <Head>
        <title>Weinzelt - Impressum</title>
      </Head>
      <main className="max-w-xl mx-auto px-5 mb-5">
        <h1 className="text-2xl text-center mt-5">Impressum</h1>
        <div className="w-full border-t-[1px] border-gray-500 my-2"></div>
        <h3 className="text-lg mt-5">
          Verantwortlich für den Inhalt der Website:
        </h3>
        <div className="w-full border-t-[1px] border-gray-500 my-2"></div>
        <p>Weinzelt GmbH</p>
        <p>Heesenstraße 74</p>
        <p>40549 Düsseldorf</p>
        <br />
        <p>Telefon: 0211-87979721</p>
        <p>E-Mail: info@dasweinzelt.de</p>
        <br />
        <p>Geschäftsführung:</p>
        <p>Sebastian Kreimeyer & Nico von der Ohe</p>
        <br />
        <p>Umsatzsteuer. Ident-Nr.: TODO</p>
        <p>Handelsregister: Amtsgericht Düsseldorf HRB 109096</p>
      </main>
    </>
  );
}
