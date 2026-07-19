import { KeyboardArrowRight } from '@mui/icons-material';
import Link from 'next/link';

const options = [
  {
    title: 'VIP-Tisch',
    eyebrow: 'Für Genießer',
    description:
      'Dein eigener Tisch, Zugang zur WineCorner und eine kuratierte Auswahl besonderer Weine – mitten im Geschehen.',
    image: '/home/vipArea.jpg',
    alt: 'VIP-Tische und WineCorner im Weinzelt',
    href: '/reservation/vip',
    cta: 'VIP-Tisch reservieren',
    dark: false,
  },
  {
    title: 'Stehtisch',
    eyebrow: 'Für deine Crew',
    description:
      'Ein fester Treffpunkt für die Gruppe, kurze Wege zur Tanzfläche und genau der richtige Platz für einen langen Abend.',
    image: '/home/standing-tables.jpg',
    alt: 'Stehtische für Gruppen im Weinzelt',
    href: '/reservation/standing',
    cta: 'Stehtisch reservieren',
    dark: true,
  },
];

export default function ReservationOptionsSection() {
  return (
    <section id="reservieren" className="bg-stone-100 px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
            Reservieren
          </p>
          <h2 className="text-4xl font-cocogoose text-black sm:text-5xl">
            Dein Platz im Weinzelt.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-700">
            Komm spontan vorbei oder sichere deiner Gruppe vorab einen festen
            Platz. Tischgrößen, Mindestverzehr und aktuelle Verfügbarkeit siehst
            du direkt im Buchungsprozess.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {options.map((option) => (
            <article
              key={option.title}
              className={`grid overflow-hidden rounded-[2rem] shadow-xl sm:grid-cols-[0.9fr_1.1fr] ${
                option.dark ? 'bg-stone-900 text-white' : 'bg-white text-black'
              }`}
            >
              <div className="relative min-h-72 sm:min-h-full">
                <img
                  src={option.image}
                  alt={option.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col p-6 sm:p-8">
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.25em] ${
                    option.dark ? 'text-white/55' : 'text-gray-500'
                  }`}
                >
                  {option.eyebrow}
                </p>
                <h3 className="mt-3 text-3xl font-cocogoose">
                  {option.title}
                </h3>
                <p
                  className={`mt-4 leading-relaxed ${
                    option.dark ? 'text-white/75' : 'text-gray-700'
                  }`}
                >
                  {option.description}
                </p>

                <div className="mt-auto pt-7">
                  <Link
                    href={option.href}
                    className={`inline-flex items-center rounded-full px-6 py-3 font-semibold transition ${
                      option.dark
                        ? 'bg-white text-black hover:bg-stone-200'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {option.cta}
                    <KeyboardArrowRight fontSize="small" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-[2rem] border border-black/10 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              Ohne Reservierung
            </p>
            <h3 className="mt-2 text-2xl font-cocogoose">
              Einfach vorbeikommen.
            </h3>
            <p className="mt-2 max-w-3xl text-gray-700">
              Der Eintritt ins Weinzelt ist frei. Eine Reservierung ist nicht
              erforderlich und lohnt sich vor allem für Gruppen, die einen
              festen Treffpunkt möchten.
            </p>
          </div>

          <Link
            href="/#programm"
            className="shrink-0 rounded-full border border-black/15 px-6 py-3 font-semibold text-black transition hover:bg-stone-100"
          >
            Programm ansehen
          </Link>
        </div>
      </div>
    </section>
  );
}
