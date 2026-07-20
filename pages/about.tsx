import Footer from '@/components/footer';
import HtmlHead from '@/components/htmlHead';
import Navbar from '@/components/navbar';
import { Session } from '@/hooks/useSession';
import { team } from '@/lib/team';
import Link from 'next/link';
import Image from 'next/image';

type Company = 'KM' | 'CR' | 'MD';

const companyMeta: Record<
  Company,
  {
    name: string;
    logo: string;
    description: string;
  }
> = {
  KM: {
    name: 'KM Entertainment',
    logo: '/partners/km-logo.png',
    description: 'Konzept, Veranstaltung und Gastfreundschaft.',
  },
  CR: {
    name: 'Concept Riesling',
    logo: '/partners/cr-logo.webp',
    description: 'Weinkompetenz, Genuss und besondere Tropfen.',
  },
  MD: {
    name: 'Mr Düsseldorf',
    logo: '/partners/mrdus-logo.png',
    description: 'Düsseldorf, Community und echtes Stadtgefühl.',
  },
};

function CompanyLogo({
  company,
  className = '',
}: {
  company: Company;
  className?: string;
}) {
  const data = companyMeta[company];

  return (
    <img
      src={data.logo}
      alt={data.name}
      className={`max-h-9 max-w-[140px] object-contain ${className}`}
    />
  );
}

function ValueCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">
        {number}
      </p>

      <h3 className="mt-5 text-2xl font-cocogoose leading-tight text-black">
        {title}
      </h3>

      <p className="mt-4 leading-relaxed text-gray-600">{text}</p>
    </article>
  );
}

export default function AboutPage({ session }: { session: Session }) {
  return (
    <div className="min-h-screen bg-white font-sans">
      <HtmlHead title="Weinzelt – Über uns" />

      <Navbar session={session} />

      <main>
        {/* Hero */}
        <section className="relative min-h-[620px] overflow-hidden bg-stone-950 text-white sm:min-h-[720px]">
          <Image
            src="/team/team.jpg"
            alt="Das Team hinter dem Weinzelt"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

          <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-end px-4 pb-16 pt-24 sm:min-h-[720px] sm:pb-24">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
                Über das Weinzelt
              </p>

              <h1 className="mt-5 text-4xl font-cocogoose leading-[1.05] sm:text-6xl md:text-7xl">
                Gastfreundschaft,
                <br />
                die man schmeckt.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-xl">
                Das Weinzelt verbindet besondere Weine, gute Musik und echte
                Düsseldorfer Lebensfreude – getragen von Menschen, die
                Gastfreundschaft nicht nur organisieren, sondern leben.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="#team"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-stone-200"
                >
                  Unser Team kennenlernen
                </Link>

                <Link
                  href="/impressions"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Impressionen ansehen
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Einleitung */}
        <section className="px-4 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                Mehr als ein Zelt
              </p>

              <h2 className="mt-4 text-4xl font-cocogoose leading-tight text-black sm:text-5xl">
                Ein Ort, an dem Düsseldorf zusammenkommt.
              </h2>

              <p className="mt-6 text-lg leading-relaxed text-gray-600">
                Das Weinzelt auf der Rheinkirmes ist mehr als ein Ort zum
                Anstoßen. Es ist ein Treffpunkt für besondere Begegnungen,
                Lebensfreude im Glas und unbeschwerte Stunden mitten in
                Düsseldorf.
              </p>

              <p className="mt-5 text-lg leading-relaxed text-gray-600">
                Tagsüber genießt du ausgewählte Weine, gutes Essen und den Blick
                auf das Kirmesgeschehen. Abends werden aus entspannten
                Gesprächen lange Nächte mit Musik, Licht und einer Atmosphäre,
                die irgendwo zwischen Weingarten und Club liegt.
              </p>

              <p className="mt-7 text-xl font-semibold leading-relaxed text-black">
                Wein verbindet. Das Weinzelt bringt zusammen.
              </p>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[2rem]">
                <img
                  src="/home/partyByDay.jpg"
                  alt="Gäste feiern tagsüber im Weinzelt"
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>

              <div className="absolute -bottom-6 -left-2 max-w-xs rounded-[1.5rem] bg-black p-6 text-white shadow-xl sm:-left-6">
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">
                  Unser Anspruch
                </p>

                <p className="mt-3 text-lg font-semibold leading-relaxed">
                  Qualität ohne Steifheit. Stimmung ohne Beliebigkeit.
                  Gastfreundschaft mit Herz.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Werte */}
        <section className="bg-stone-100 px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                Was uns wichtig ist
              </p>

              <h2 className="mt-4 text-4xl font-cocogoose leading-tight text-black sm:text-5xl">
                Mit Liebe zum Detail.
                <br />
                Ohne unnötigen Schnickschnack.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <ValueCard
                number="01"
                title="Echte Gastfreundschaft"
                text="Wir möchten, dass sich jeder Gast vom ersten Moment an willkommen fühlt – aufmerksam, persönlich und unkompliziert."
              />

              <ValueCard
                number="02"
                title="Genuss mit Charakter"
                text="Unsere Weine, Speisen und Drinks werden bewusst ausgewählt. Nicht möglichst viel, sondern möglichst gut."
              />

              <ValueCard
                number="03"
                title="Stimmung mit Stil"
                text="Gute Musik, besonderes Licht und die richtigen Menschen schaffen einen Abend, der lebendig und gleichzeitig hochwertig bleibt."
              />
            </div>
          </div>
        </section>

        {/* Team */}
        <section id="team" className="px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                  Die Menschen dahinter
                </p>

                <h2 className="mt-4 text-4xl font-cocogoose leading-tight text-black sm:text-5xl">
                  Unser Team.
                </h2>

                <p className="mt-5 text-lg leading-relaxed text-gray-600">
                  Unterschiedliche Erfahrungen, gemeinsame Leidenschaft: Wir
                  verbinden Event, Wein und Düsseldorf zu einem Ort, an dem
                  Menschen gerne zusammenkommen.
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Weinzelt Düsseldorf · Rheinkirmes
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => {
                const company = companyMeta[member.company];

                return (
                  <article key={member.name} className="group">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-stone-200">
                      <img
                        src={member.imgSrc}
                        alt={member.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />

                      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                        <p className="text-sm text-white/65">{company.name}</p>

                        <h3 className="mt-1 text-2xl font-semibold leading-tight">
                          {member.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex min-h-16 items-center justify-between gap-4 px-2 pt-4">
                      <CompanyLogo company={member.company} />

                      <p className="max-w-[190px] text-right text-xs leading-relaxed text-gray-500">
                        {company.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Partnergeschichte */}
        <section className="bg-stone-950 px-4 py-20 text-white sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/45">
                Gemeinsam für das Weinzelt
              </p>

              <h2 className="mt-4 text-4xl font-cocogoose leading-tight sm:text-5xl">
                Drei Partner.
                <br />
                Eine gemeinsame Idee.
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
                Das Weinzelt entsteht durch die Zusammenarbeit von KM
                Entertainment, Concept Riesling und Mr Düsseldorf. Gemeinsam
                verbinden wir Veranstaltungserfahrung, Weinkompetenz und
                Düsseldorfer Community.
              </p>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/65">
                Daraus entsteht ein Ort, der vertraut und gleichzeitig besonders
                ist – mitten auf der Rheinkirmes und fest mit Düsseldorf
                verbunden.
              </p>
            </div>

            <div className="grid gap-4">
              {(Object.keys(companyMeta) as Company[]).map((companyKey) => {
                const company = companyMeta[companyKey];

                return (
                  <article
                    key={companyKey}
                    className="grid gap-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:grid-cols-[180px_1fr] sm:items-center"
                  >
                    <div className="flex min-h-16 items-center justify-center rounded-xl bg-white p-4">
                      <CompanyLogo company={companyKey} />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold">{company.name}</h3>

                      <p className="mt-2 leading-relaxed text-white/55">
                        {company.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden px-4 py-20 sm:py-28">
          <div className="absolute inset-0">
            <img
              src="/home/dj.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/45" />

          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-3xl text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
                Wir sehen uns im Weinzelt
              </p>

              <h2 className="mt-4 text-4xl font-cocogoose leading-tight sm:text-6xl">
                Komm vorbei.
                <br />
                Stoß mit uns an.
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
                Ob entspannter Nachmittag, besonderer Anlass oder lange Nacht:
                Wir freuen uns darauf, dich im Weinzelt willkommen zu heißen.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/reservation"
                  className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 font-semibold text-black transition hover:bg-stone-200"
                >
                  Tisch reservieren
                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </Link>

                <Link
                  href="/#programm"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Programm entdecken
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
