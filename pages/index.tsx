import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Divider, Drawer } from '@mui/material';
import CountdownSection from '@/components/countdown';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="font-sans relative">
      <Link
        href="/reservation"
        className="fixed bottom-5 right-5 inline-block sm:hidden z-10 bg-black text-white px-3 py-2 rounded-full shadow-xl"
      >
        Jetzt reservieren
      </Link>
      <header className="fixed w-full bg-white shadow z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src="/logo.png" alt="WEINZELT" className="w-32 sm:w-40" />
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="#vip">VIP</Link>
            <Link href="#gastro">Speisen & Getränke</Link>
            <Link href="#musik">Musik</Link>
            <Link href="#partner">Partner</Link>
            <Link
              href="/reservation"
              className="inline-block bg-black text-white px-3 py-2 rounded-full shadow hover:bg-gray-300 hover:text-black"
            >
              Tisch reservieren
            </Link>
          </nav>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
        <Drawer
          className="md:hidden"
          anchor="right"
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        >
          <div className="p-5 flex flex-col gap-4 text-left text-xl min-w-[70vw]">
            <div className="flex justify-end">
              <button onClick={() => setMenuOpen(false)}>
                <CloseIcon fontSize="large" />
              </button>
            </div>
            <Link href="#vip" onClick={() => setMenuOpen(false)}>
              VIP
            </Link>
            <Divider />
            <Link href="#gastro" onClick={() => setMenuOpen(false)}>
              Speisen & Getränke
            </Link>
            <Divider />
            <Link href="#musik" onClick={() => setMenuOpen(false)}>
              Musik
            </Link>
            <Divider />
            <Link href="#partner" onClick={() => setMenuOpen(false)}>
              Partner
            </Link>
            <Divider />
            <Link href="/reservation">Tisch reservieren</Link>
          </div>
        </Drawer>
      </header>

      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[80vh] flex items-center justify-center bg-black text-white">
        <Image
          src="/home/weinzelt.png"
          alt="Weinzelt"
          layout="fill"
          objectFit="cover"
          className="opacity-60"
        />
      </section>

      {/* Konzept */}
      <section id="konzept" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-6 text-center">Das Weinzelt</h2>
        <h3 className="text-2xl italic font-medium text-center text-gray-700 mb-10">
          „Ein Zelt, das den Düsseldorfer Lifestyle widerspiegelt“
        </h3>
        <div className="grid md:grid-cols-[2fr_1fr] lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <p className="text-lg leading-relaxed text-gray-800">
              Das Weinzelt vereint stilvollen Weingenuss, kulinarische
              Highlights aus der Region und eine energiegeladene Partystimmung -
              perfekt abgestimmt auf die Atmosphäre der Rheinkirmes und das
              Lebensgefühl Düsseldorfs.
            </p>
            <p className="text-lg leading-relaxed text-gray-800">
              Als besonderes Highlight bringt der Carlsplatz, Düsseldorfs
              kulinarisches Herz, den Weinstand „Concept Riesling“ ins Zelt.
              Tagsüber ist das Weinzelt ein entspannter Treffpunkt - abends
              verwandelt es sich in eine vibrierende Location mit elektronischer
              Musik.
            </p>
          </div>
          <div>
            <img
              src="/home/partyByDay.jpg"
              alt="Party bei Tag"
              className="w-full h-full object-cover rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* VIP Bereich */}
      <section id="vip" className="bg-gray-100 py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[2fr_1fr] gap-12 items-center">
          {/* Textbereich */}
          <div>
            <h2 className="text-4xl font-bold mb-6">Exklusiver VIP-Bereich</h2>
            <p className="text-lg text-gray-800 mb-4">
              Wein-Genuss in Perfektion: Von unkomplizierten Rieslingen bis hin
              zu seltenen Raritäten - im VIP-Bereich erleben echte Weinliebhaber
              ausgewählte Spitzenweine, kuratiert von{' '}
              <span className="font-semibold">Concept Riesling</span>.
            </p>
            <p className="text-lg text-gray-800 mb-4">
              Jeden Abend finden exklusive Raritäten-Verkostungen statt -
              begleitet von einem erfahrenen Sommelier, der spannende
              Hintergründe zu jedem Wein liefert.
            </p>
            <p className="text-lg text-gray-800 mb-4">
              Für die richtige Stimmung sorgen ein Live-DJ, elektronische Musik
              und eine beeindruckende LED-Lichtshow - perfekt abgestimmt auf die
              Atmosphäre des Abends.
            </p>
            <p className="text-lg text-gray-800 mb-4">
              Neben rheinischen Weinen aus <span className="italic">Mosel</span>
              , <span className="italic">Rheingau</span> und{' '}
              <span className="italic">Rheinhessen</span> umfasst die Auswahl
              auch internationale Klassiker wie{' '}
              <span className="italic">Chardonnay</span> und{' '}
              <span className="italic">Merlot</span> sowie{' '}
              <span className="italic">Champagner</span> und{' '}
              <span className="italic">Sekt</span> für besondere Anlässe.
            </p>
            <Link
              href="/reservation"
              className="inline-block bg-black text-white px-6 py-3 rounded-full shadow-md hover:bg-gray-300 hover:text-black transition"
            >
              Jetzt Tisch reservieren
            </Link>
          </div>

          {/* Bildbereich */}
          <div>
            <img
              src="/home/vipArea.jpg"
              alt="VIP Bereich im Weinzelt"
              className="w-full h-full object-cover rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* Speisen & Getränke */}
      <section id="gastro" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[2fr_1fr] gap-12 items-center">
          {/* Textbereich */}
          <div>
            <h2 className="text-4xl font-bold mb-6">Speisen & Getränke</h2>
            <p className="text-lg text-gray-800 mb-4">
              Freu dich auf eine kuratierte Auswahl regionaler Spezialitäten -
              perfekt abgestimmt auf unser Weinangebot. Ob herzhafte Klassiker
              oder feine Snacks zum Glas Riesling - unsere Küche verbindet
              Qualität mit Genuss.
            </p>
            <p className="text-lg text-gray-800 mb-6">
              Die Getränkekarte umfasst hochwertige Weine, prickelnden Sekt,
              ausgewählte Cocktails sowie alkoholfreie Alternativen - alles, was
              den Abend unvergesslich macht.
            </p>
            <Link
              href="/getraenkekarte"
              className="inline-block bg-black text-white px-6 py-3 rounded-full shadow-md hover:bg-gray-300 hover:text-black transition"
            >
              Zur Getränkekarte
            </Link>
          </div>

          {/* Bildbereich */}
          <div>
            <img
              src="/home/champagne.jpg"
              alt="Speisen und Weine"
              className="w-full h-full object-cover rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* Musik */}
      <section id="musik" className="py-20 px-4 bg-black text-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Textbereich */}
          <div>
            <h2 className="text-4xl font-bold mb-6">Musik & DJs</h2>
            <p className="text-lg mb-4 text-gray-300">
              Wenn die Sonne untergeht, beginnt die Party: Unser Zelt verwandelt
              sich abends in eine pulsierende Tanzfläche mit ausgewählten House-
              und Electro-DJs.
            </p>
            <p className="text-lg mb-4 text-gray-300">
              Begleitet von einer eindrucksvollen LED-Lichtshow entsteht eine
              Atmosphäre, die zum Feiern einlädt - urban, stilvoll und mit
              echtem Club-Feeling mitten auf der Rheinkirmes.
            </p>
            <p className="text-lg text-gray-300">
              Von Deep House über treibende Beats bis hin zu elektronischen
              Klassikern - unsere musikalische Kuratierung sorgt für
              einzigartige Nächte unter dem Sternenhimmel.
            </p>
          </div>

          {/* Bildbereich */}
          <div>
            <img
              src="/home/dj.jpg"
              alt="DJ auf der Bühne"
              className="w-full h-full object-cover rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </section>

      <CountdownSection />

      {/* Partner */}
      <section
        id="partner"
        className="max-w-5xl mx-auto px-4 py-16 text-center"
      >
        <h2 className="text-3xl font-bold mb-4">Unsere Partner</h2>
        <p className="text-gray-600 mb-10">
          Wir bedanken uns herzlich bei unseren Partnern für die wertvolle
          Unterstützung!
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 items-center justify-center">
          <a
            href="https://conceptriesling.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/cr-logo.webp"
              alt="Concept Riesling"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
          <a
            href="https://derweindampfer.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/weindampfer-logo.png"
              alt="Weindampfer"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
          <a
            href="https://www.mrduesseldorf.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/mrdus-logo.png"
              alt="Mr Düsseldorf"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
          <a
            href="https://mlsp.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/mls-logo.jpg"
              alt="MLS"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white text-sm py-6 px-4 text-center">
        <p>&copy; 2025 Weinzelt GmbH</p>
        <div className="mt-2">
          <Link href="/imprint" className="underline mx-2">
            Impressum
          </Link>
          <Link href="/privacy" className="underline mx-2">
            Datenschutz
          </Link>
        </div>
      </footer>
    </div>
  );
}
