import Image from 'next/image';
import Link from 'next/link';
import { Divider } from '@mui/material';
import Countdown from '@/components/countdown';
import { Session } from '@/hooks/useSession';
import { KeyboardArrowRight } from '@mui/icons-material';
import { events } from '@/lib/events';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import SpecialEventRegistrationDialog from '@/components/specialEventRegistrationDialog';
import FoodGrid from '@/components/foodGrid';
import { InstagramReel } from '@/components/instagramReel';
import HeroFade from '@/components/heroFade';

export default function Home({ session }: { session: Session }) {
  return (
    <div className="font-sans relative">
      <div className="fixed bottom-0 left-0 w-full sm:hidden z-10 bg-gray-100 px-3 py-2 flex items-center justify-center">
        <Link
          href="/reservation"
          className="flex items-center justify-center text-2xl"
        >
          <p className="font-semibold text-lg">Jetzt reservieren</p>
          <KeyboardArrowRight fontSize="inherit" />
        </Link>
      </div>
      <Navbar session={session} />

      <HeroFade />

      {/* Konzept */}
      <section id="konzept" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl mb-6 text-center font-cocogoose">
          Weinzelt - Wine meets Rheinkirmes
        </h2>
        <h3 className="text-2xl italic font-medium text-center text-gray-700 mb-10">
          „Von Düsseldorfern für alle, die Lust auf Wein haben!“
        </h3>
        <div className="grid md:grid-cols-[7fr_4fr] gap-10 items-center">
          <div className="space-y-4">
            <p className="text-lg leading-relaxed text-gray-800">
              Willkommen im Weinzelt - dein Platz für Genuss, Musik und echtes
              Düsseldorfer Lebensgefühl auf der Rheinkirmes!
            </p>
            <p className="text-lg leading-relaxed text-gray-800 font-bold text-center">
              Wein. Beats. Düsseldorf.
            </p>
            <p className="text-lg leading-relaxed text-gray-800">
              Im <b>Weinzelt</b> wird nicht einfach nur getrunken - hier wird
              gefeiert, geschlemmt und stilvoll zelebriert. Zwischen feinem
              Riesling, regionalen Leckerbissen und einer Atmosphäre, die
              zwischen Afterwork-Vibes und Spontan-Urlaub liegt, erlebst du die
              <b> Rheinkirmes von ihrer geschmackvollsten Seite.</b>
            </p>
            <p className="text-lg leading-relaxed text-gray-800">
              Tagsüber ist das Zelt dein Place-to-be für entspanntes Daydrinking
              und gute Gespräche. Und abends? Da drehen wir auf. Mit
              elektronischen Sounds, kühlen Gläsern und besten Leuten wird aus
              dem Weinzelt eine pulsierende Party-Location.
            </p>
            <p className="text-lg leading-relaxed text-gray-800">
              Mit dabei: <b>„Concept Riesling“ vom Carlsplatz</b> - Düsseldorfs
              Antwort auf langweilige Weinkarten. Hier trifft Charakter auf
              Qualität und Spaß am Glas!
            </p>
            <p className="text-lg leading-relaxed text-gray-800">
              Komm vorbei. Probier dich durch. Und genieß Düsseldorf von seiner
              leckersten Seite.
            </p>
            <Link
              href="/impressions"
              className="inline-block mx-auto text-center bg-black text-white px-6 py-3 rounded-full shadow-md hover:bg-gray-300 hover:text-black transition"
            >
              Zu den Fotos 2025
            </Link>
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
      <section id="vip" className="bg-stone-100 py-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row-reverse gap-12 items-center">
          {/* Textbereich */}
          <div className="w-full sm:w-2/3">
            <h2 className="text-4xl font-cocogoose mb-6">VIP, Baby!</h2>
            <p className="text-lg text-gray-800 mb-4">
              Hier wird Wein zu deinem Erlebnis: an deinem exklusiven Tisch
              triffst du auf feine Tropfen mit Charakter - von{' '}
              <b>easy-drinking Rieslingen bis zu echten Raritäten</b>, die du
              garantiert nicht an jeder Ecke bekommst. Concept Riesling hat für
              dich kuratiert, was das Herz anspruchsvoller Genießer höher
              schlagen lässt.
            </p>
            <p className="text-lg text-gray-800 mb-4">
              Jeden Abend gibt's was Besonderes auf die Zunge:{' '}
              <b>Weincorner mit Sommelier-Begleitung</b>, charmant,
              kenntnisreich und garantiert nicht trocken. Wenn du auf den
              Geschmack gekommen bist, bietet dir die Weincorner über 100
              Positionen feinster Raritäten.
            </p>
            <p className="text-lg text-gray-800 mb-4">
              Dazu? Beats, Bass & gute Laune. Ein Live-DJ legt auf, die Stimmung
              steigt, das Licht tanzt - und du mittendrin mit einem Glas in der
              einen Hand und deinen Freunden in der anderen Hand!
            </p>
            <p className="text-lg text-gray-800 mb-4">
              Zugang zu Raritätencorner inklusive. Champagner, Sekt &
              Signature-Weine. Live-DJ & Beats on Point. Concept Riesling
              curated.
            </p>
            <p className="text-lg text-gray-800 mb-4 font-bold">
              Limitiert. Besonders. Und absolut nicht langweilig.
            </p>
            <Link
              href="/reservation/vip"
              className="inline-block bg-black text-white px-6 py-3 rounded-full shadow-md hover:bg-gray-300 hover:text-black transition"
            >
              Jetzt Tisch reservieren
            </Link>
          </div>

          {/* Bildbereich */}
          <div className="w-full sm:w-1/3">
            <img
              src="/home/vipArea.jpg"
              alt="VIP Bereich im Weinzelt"
              className="w-full h-full object-cover rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* Stehtische */}
      <section id="standing-tables" className="bg-stone-800 py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[2fr_1fr] gap-12 items-center">
          {/* Textbereich */}
          <div>
            <h2 className="text-4xl font-cocogoose text-white mb-6">
              Stehtische für die Crew
            </h2>
            <p className="text-lg text-gray-300 mb-4">
              Du und deine Freunde, bereit für eine Nacht, die sich gewaschen
              hat? Unsere Stehtische bieten Platz für bis zu 16 Personen -
              perfekt für eine coole Crew, die den Vibe spüren will. Ohne
              Schnickschnack, dafür mit allem, was den Abend unvergesslich
              macht.
            </p>
            <p className="text-lg text-gray-300 mb-4 font-bold">
              Mach dich bereit für gute Musik, coole Leute und natürlich: den
              besten Platz auf der Tanzfläche!
            </p>
            <Link
              href="/reservation/standing"
              className="inline-block bg-white text-black px-6 py-3 rounded-full shadow-md hover:bg-stone-300 transition"
            >
              Jetzt Stehtisch reservieren
            </Link>
          </div>

          {/* Bildbereich */}
          <div>
            <img
              src="/home/standing-tables.jpg"
              alt="Stehtische im Weinzelt"
              className="w-full h-full object-cover rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* Musik */}
      <section id="musik" className="py-20 bg-black text-white">
        <div className="px-4 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Textbereich */}
          <div>
            <h2 className="text-4xl font-cocogoose mb-6">
              Sound on, Alltag off.
            </h2>
            <p className="text-lg mb-4 text-gray-300">
              Sobald die Sonne untergeht, übernimmt der Beat:{' '}
              <b>Das Weinzelt wird zur Tanzfläche</b> - und zwar nicht
              irgendeine. Ausgewählte House- und Electro-DJs sorgen für den
              Soundtrack deiner Nacht, live begleitet von einer{' '}
              <b>LED-Lichtshow</b>, die mehr Festival als Volksfest schreit.
              Hier trifft <b>urbaner Club-Vibe auf Kirmesflair</b> - stilvoll,
              elektrisierend und garantiert tanzbar.
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

        <h3 className="text-2xl font-cocogoose text-center text-white mt-12 mb-6">
          Ein kleiner Vorgeschmack gefällig?
        </h3>
        <div className="flex justify-center mx-5">
          <InstagramReel />
        </div>
        <h3 className="text-2xl font-cocogoose text-center text-white mt-12 mb-6">
          Letztes Jahr war nur der Anfang...
        </h3>

        {/* Eventkalender */}
        {/* <div className="mt-12">
          <h3 className="text-2xl font-cocogoose text-center text-white mb-6">
            Unsere Events im Weinzelt
          </h3>
          <div className="flex overflow-x-auto space-x-4 p-4">
            {events.map((e) => (
              <div
                key={`${e.date}${e.title}`}
                className="flex-shrink-0 w-72 bg-neutral-900 rounded-lg shadow-lg hover:bg-neutral-800 hover:scale-105 transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <img src={e.image} alt={e.title} />
                  <div className="px-3 py-2 flex flex-col">
                    <p className="text-lg font-semibold text-white">{e.date}</p>
                    <p className="text-base font-light text-gray-300">
                      {e.from}
                    </p>
                    <p className="text-gray-300 text-xl mt-2">{e.title}</p>
                    <Divider
                      sx={{ marginY: 2 }}
                      className="bg-gray-400 w-2/3"
                    />
                    <p className="text-gray-400 text-sm">{e.description}</p>
                  </div>
                </div>
                {e.button.specialEventId && (
                  <SpecialEventRegistrationDialog
                    id={e.button.specialEventId}
                    buttonLabel={e.button.text}
                  />
                )}
                {e.button.link && (
                  <Link
                    className="w-full py-3 text-center bg-gray-200 inline-block text-black hover:underline text-lg"
                    href={e.button.link}
                    target={e.button.external ? '_blank' : '_self'}
                    rel={e.button.external ? 'noopener noreferrer' : undefined}
                  >
                    {e.button.text}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div> */}
      </section>

      {/* Speisen & Getränke */}
      <section id="gastro" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[2fr_1fr] gap-12 items-center">
          {/* Textbereich */}
          <div>
            <h2 className="text-4xl font-cocogoose mb-6">
              Für Foodies & Feintrinker.
            </h2>
            <p className="text-lg text-gray-800 mb-4">
              Hungrig bleibst du hier ganz sicher nicht - unsere{' '}
              <b>ausgesuchte Auswahl regionaler Leckerbissen</b> passt wie ein
              gut temperierter Riesling zu deinem Glas. Von herzhaften
              Klassikern bis zu feinen Snacks für zwischendurch: Unsere Küche
              trifft den Geschmack - ehrlich, hochwertig und einfach richtig
              gut.
            </p>
            <p className="text-lg text-gray-800 mb-6">
              <b>Weine mit Charakter</b>, spritziger Sekt, ausgewählte Drinks
              und clevere alkoholfreie Alternativen. Alles, was du brauchst für
              einen Abend, der stilvoll knallt!
            </p>
            {/* <div className="flex flex-col items-center sm:items-start gap-3">
              <Link
                href="/weinzelt-food.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border border-black text-black px-6 py-3 rounded-full shadow-md hover:bg-gray-200 hover:text-black text-center transition"
              >
                Entdecke unser Weingarten Menu
              </Link>
              <Link
                href="/weinzelt-drinks.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-black text-white px-6 py-3 rounded-full shadow-md hover:bg-gray-300 hover:text-black transition"
              >
                Jetzt Karte checken{' '}
                <span className="hidden sm:inline">
                  & Lieblingstropfen finden!
                </span>
              </Link>
            </div> */}
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
        <FoodGrid />
      </section>

      <section
        id="countdown"
        className="py-20 bg-gradient-to-tr from-gray-100 to-blue-100 text-black text-center px-4"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <img src="/logo.png" alt="Logo" className="w-80 h-auto mb-4" />
          <p className="text-xl md:text-2xl">
            Ab dem <b>17.07.2026</b> wird wieder eingeschenkt! Wein, Beats &
            beste Stimmung -{' '}
            <b>wir sehen uns im Weinzelt auf der Rheinkirmes!</b>
          </p>
          <p className="uppercase tracking-widest text-sm text-gray-700 mt-10">
            Noch
          </p>
          <Countdown targetDate="2026-07-17T14:00:00" />
          <p className="uppercase tracking-widest text-sm text-gray-700">
            bis zum Opening
          </p>
        </div>
      </section>

      {/* Partner */}
      <section
        id="partner"
        className="max-w-5xl mx-auto px-4 py-16 text-center"
      >
        <h2 className="text-3xl font-cocogoose mb-4">Unsere Partner</h2>
        <p className="text-gray-600 mb-10">
          Wir bedanken uns herzlich bei unseren Partnern für die wertvolle
          Unterstützung!
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 gap-y-16 items-center justify-center">
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
            href="https://km-entertainment.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/km-logo.png"
              alt="KM Entertainment"
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
          <a
            href="https://www.redbull.com/de-de"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/redBull-logo.png"
              alt="Red Bull"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
          <a
            href="https://www.gerolsteiner.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/gerolsteiner-logo.png"
              alt="Gerolsteiner"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
          <a
            href="https://foodexplorer.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/foodexplorer-logo.webp"
              alt="Food Explorer"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
          <a
            href="https://groupefrio.com/de/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/frio-logo.png"
              alt="FRIO"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
          <a
            href="https://www.goldberg-sons.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/goldberg-logo.webp"
              alt="Goldberg"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
          <a
            href="https://de.lasommeliere.com/de-de/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/laSommeliere-logo.webp"
              alt="La Sommelière"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
          <a
            href="https://www.moet-hennessy.de/de-de"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/moetHennessy-logo.png"
              alt="Moët Hennessy"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
          <a
            href="https://ta0.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/partners/ta0-logo.png"
              alt="Terminal A0"
              className="w-full max-h-20 object-contain mx-auto"
            />
          </a>
        </div>
        <h6 className="text-xl text-gray-600 mt-10">
          Du möchtest Teil vom Weinzelt werden? Dann kontaktiere uns unter{' '}
          <a
            className="underline text-black"
            href="mailto:partner@dasweinzelt.de"
          >
            partner@dasweinzelt.de
          </a>
          .
        </h6>
      </section>

      <Footer />
    </div>
  );
}
