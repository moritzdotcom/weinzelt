import { KeyboardArrowRight } from '@mui/icons-material';
import Link from 'next/link';
import EventStatusSection from '@/components/home/eventStatusSection';
import EventDaysSection from '@/components/home/eventDaysSection';
import NewsletterSection from '@/components/home/newsletterSection';
import ReservationOptionsSection from '@/components/home/reservationOptionsSection';
import SpecialEventsSection from '@/components/home/specialEventSection';
import TodaySection from '@/components/home/todaySection';
import FoodGrid from '@/components/foodGrid';
import Footer from '@/components/footer';
import HeroFade from '@/components/heroFade';
import HtmlHead from '@/components/htmlHead';
import Navbar from '@/components/navbar';
import { Session } from '@/hooks/useSession';

const partnerLogos = [
  {
    href: 'https://conceptriesling.com/',
    src: '/partners/cr-logo.webp',
    alt: 'Concept Riesling',
  },
  {
    href: 'https://km-entertainment.de/',
    src: '/partners/km-logo.png',
    alt: 'KM Entertainment',
  },
  {
    href: 'https://www.mrduesseldorf.de/',
    src: '/partners/mrdus-logo.png',
    alt: 'Mr Düsseldorf',
  },
  {
    href: 'https://derweindampfer.de/',
    src: '/partners/weindampfer-logo.png',
    alt: 'Weindampfer',
  },
  {
    href: 'https://mlsp.de/',
    src: '/partners/mls-logo.jpg',
    alt: 'MLS',
  },
  {
    href: 'https://www.redbull.com/de-de',
    src: '/partners/redBull-logo.png',
    alt: 'Red Bull',
  },
  {
    href: 'https://www.gerolsteiner.de/',
    src: '/partners/gerolsteiner-logo.png',
    alt: 'Gerolsteiner',
  },
  {
    href: 'https://www.goldberg-sons.com/',
    src: '/partners/goldberg-logo.webp',
    alt: 'Goldberg',
  },
  {
    href: 'https://de.lasommeliere.com/de-de/',
    src: '/partners/laSommeliere-logo.webp',
    alt: 'La Sommelière',
  },
  {
    href: 'https://www.moet-hennessy.de/de-de',
    src: '/partners/moetHennessy-logo.png',
    alt: 'Moët Hennessy',
  },
  {
    href: 'https://estrellagalicia.com/de/',
    src: '/partners/estrella-logo.png',
    alt: 'Estrella Galicia',
  },
];

function GoodToKnowSection() {
  const items = [
    ['Wann', '17.-26. Juli 2026'],
    ['Wo', 'Rheinkirmes Düsseldorf'],
    ['Eintritt', 'Kostenlos'],
    ['Reservierung', 'Optional, für Gruppen empfohlen'],
  ];

  return (
    <section className="px-4 pb-12 pt-16">
      <div className="mx-auto max-w-6xl">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
          Gut zu wissen
        </p>
        <div className="grid overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([label, value], index) => (
            <div
              key={label}
              className={`p-6 text-center ${
                index > 0
                  ? 'border-t border-black/10 sm:border-l sm:border-t-0'
                  : ''
              } ${index === 2 ? 'lg:border-l' : ''}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                {label}
              </p>
              <p className="mt-2 font-semibold text-black">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home({ session }: { session: Session }) {
  return (
    <div className="relative bg-[#f8f6f2] font-sans text-black">
      <HtmlHead />

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-black/10 bg-white/95 p-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-lg md:hidden">
        <Link
          href="/#programm"
          className="flex items-center justify-center rounded-full px-3 py-3 text-sm font-semibold"
        >
          Programm
        </Link>
        <Link
          href="/reservation"
          className="flex items-center justify-center rounded-full bg-black px-3 py-3 text-sm font-semibold text-white"
        >
          Reservieren
          <KeyboardArrowRight fontSize="small" />
        </Link>
      </div>

      <Navbar session={session} />
      <HeroFade />
      <TodaySection />
      <GoodToKnowSection />

      <section id="konzept" className="scroll-mt-24 px-4 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gray-500">
              Das Weinzelt
            </p>
            <h2 className="mt-3 text-4xl font-cocogoose leading-tight sm:text-5xl">
              Wine meets Rheinkirmes.
            </h2>
            <p className="mt-6 text-xl font-medium text-gray-800">
              Von Düsseldorfern für alle, die Lust auf Wein haben.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-gray-700">
              Tagsüber treffen ausgewählte Weine, regionale Küche und entspannte
              Gespräche aufeinander. Abends wird das Weinzelt mit DJs, Licht und
              elektronischen Sounds zur Tanzfläche.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Gemeinsam mit Concept Riesling bringen wir Charakter ins Glas -
              von unkomplizierten Favoriten bis zu besonderen Raritäten in der
              WineCorner.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {['Ausgewählte Weine', 'Regionale Küche', 'Live-DJs'].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>

            <Link
              href="/impressions"
              className="mt-8 inline-flex rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
            >
              Stimmung ansehen
            </Link>
          </div>

          <div className="overflow-hidden rounded-[2rem] shadow-xl">
            <img
              src="/home/partyByDay.jpg"
              alt="Gäste genießen das Weinzelt am Nachmittag"
              className="aspect-[4/5] w-full object-cover transition duration-500 hover:scale-[1.02]"
            />
          </div>
        </div>
      </section>

      <ReservationOptionsSection />
      <EventDaysSection />
      <SpecialEventsSection />

      <section id="gastro" className="scroll-mt-24 bg-white px-4 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gray-500">
              Speisen & Getränke
            </p>
            <h2 className="mt-3 text-4xl font-cocogoose leading-tight sm:text-5xl">
              Für Foodies & Feintrinker.
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gray-700">
              Regionale Leckerbissen, feine Snacks, Weine mit Charakter,
              Champagner und ausgewählte Drinks - gemacht für einen langen Tag
              und eine noch längere Nacht im Weinzelt.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/weinzelt-drinks.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-black px-6 py-3 text-center font-semibold text-white transition hover:bg-gray-800"
              >
                Getränkekarte öffnen
              </Link>
              <Link
                href="/weinzelt-food.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-black/15 px-6 py-3 text-center font-semibold text-black transition hover:bg-stone-100"
              >
                Speisekarte öffnen
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] shadow-xl">
            <img
              src="/home/champagne.jpg"
              alt="Champagner und Speisen im Weinzelt"
              className="aspect-square w-full object-cover"
            />
          </div>
        </div>

        <FoodGrid />
      </section>

      <NewsletterSection />
      <EventStatusSection />

      <section id="partner" className="bg-white px-4 py-16 text-center">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-cocogoose">Unsere Partner</h2>
          <p className="mt-4 text-gray-600">
            Danke an unsere Partner für die wertvolle Unterstützung.
          </p>

          <div className="mt-10 grid grid-cols-2 items-center gap-x-8 gap-y-14 sm:grid-cols-3 lg:grid-cols-4">
            {partnerLogos.map((partner) => (
              <a
                key={partner.href}
                href={partner.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-300 hover:scale-105"
              >
                <img
                  src={partner.src}
                  alt={partner.alt}
                  className="mx-auto max-h-16 w-full object-contain"
                />
              </a>
            ))}
          </div>

          <p className="mt-12 text-lg text-gray-600">
            Du möchtest Teil vom Weinzelt werden? Schreib uns an{' '}
            <a
              className="font-medium text-black underline underline-offset-4"
              href="mailto:partner@dasweinzelt.de"
            >
              partner@dasweinzelt.de
            </a>
            .
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
