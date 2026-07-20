import Footer from '@/components/footer';
import HtmlHead from '@/components/htmlHead';
import Navbar from '@/components/navbar';
import { Session } from '@/hooks/useSession';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

type JobId = 'VIP-Kellner:in' | 'Barkraft' | 'Küchen- & Spülhilfe' | 'Runner';

type Job = {
  id: JobId;
  icon: string;
  title: string;
  label: string;
  description: string;
  highlights: string[];
  disabled?: boolean;
};

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

const jobs: Job[] = [
  {
    id: 'VIP-Kellner:in',
    icon: '✨',
    title: 'VIP-Kellner:in',
    label: 'Service & Wein',
    description:
      'Du hast umfangreiche Erfahrung in der Gastronomie und kennst dich mit Wein aus? In unserem VIP-Bereich erwarten unsere Gäste souveräner Service, persönliche Betreuung und fachkundige Empfehlungen.',
    highlights: [
      'Mehrjährige Gastroerfahrung',
      'Sicheres Auftreten',
      'Weinwissen von Vorteil',
    ],
    disabled: true,
  },
  {
    id: 'Barkraft',
    icon: '🍷',
    title: 'Barkraft',
    label: 'Bar & Service',
    description:
      'An unserer Panorama-Bar servierst du hochwertige Weine, Aperitifs und Softdrinks. Du arbeitest zügig, behältst auch bei großem Andrang den Überblick und sorgst gemeinsam mit dem Team für gute Stimmung.',
    highlights: [
      'Erfahrung hinter der Bar',
      'Freundliches Auftreten',
      'Belastbarkeit und Tempo',
    ],
  },
  {
    id: 'Küchen- & Spülhilfe',
    icon: '🍽️',
    title: 'Küchen- & Spülhilfe',
    label: 'Küche & Organisation',
    description:
      'Du unterstützt unser Küchenteam beim Vorbereiten, Spülen und Sauberhalten der Arbeitsbereiche. Gastroerfahrung ist hilfreich, aber keine Voraussetzung, wenn du ordentlich und zuverlässig arbeitest.',
    highlights: [
      'Auch ohne Gastroerfahrung',
      'Ordentliche Arbeitsweise',
      'Zuverlässigkeit',
    ],
  },
  {
    id: 'Runner',
    icon: '🏃',
    title: 'Runner',
    label: 'Logistik & Nachschub',
    description:
      'Als Runner sorgst du dafür, dass Bars, Kühlschränke und Arbeitsbereiche jederzeit versorgt sind. Du transportierst Waren, organisierst Nachschub und bist eine wichtige Verbindung im laufenden Betrieb.',
    highlights: [
      'Körperliche Belastbarkeit',
      'Schnelle Arbeitsweise',
      'Eigeninitiative',
    ],
  },
];

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
        {label}
      </p>

      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function BenefitCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">
        {number}
      </p>

      <h3 className="mt-5 text-2xl font-cocogoose leading-tight text-black">
        {title}
      </h3>

      <p className="mt-4 leading-relaxed text-gray-600">{description}</p>
    </article>
  );
}

function JobCard({
  job,
  onApply,
}: {
  job: Job;
  onApply: (jobId: JobId) => void;
}) {
  return (
    <article
      className={[
        'relative flex h-full flex-col overflow-hidden rounded-[2rem] border p-6 sm:p-8',
        job.disabled
          ? 'border-black/5 bg-stone-100'
          : 'border-black/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-5">
        <div
          className={[
            'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl',
            job.disabled ? 'bg-stone-200 grayscale' : 'bg-black text-white',
          ].join(' ')}
          aria-hidden="true"
        >
          {job.icon}
        </div>

        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]',
            job.disabled
              ? 'bg-stone-200 text-stone-500'
              : 'bg-green-100 text-green-800',
          ].join(' ')}
        >
          {job.disabled ? 'Aktuell besetzt' : 'Wir suchen dich'}
        </span>
      </div>

      <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
        {job.label}
      </p>

      <h3
        className={[
          'mt-2 text-3xl font-cocogoose leading-tight',
          job.disabled ? 'text-gray-500' : 'text-black',
        ].join(' ')}
      >
        {job.title}
      </h3>

      <p
        className={[
          'mt-5 leading-relaxed',
          job.disabled ? 'text-gray-500' : 'text-gray-600',
        ].join(' ')}
      >
        {job.description}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {job.highlights.map((highlight) => (
          <span
            key={highlight}
            className={[
              'rounded-full border px-3 py-1.5 text-xs font-medium',
              job.disabled
                ? 'border-stone-300 text-stone-500'
                : 'border-black/10 bg-stone-50 text-gray-700',
            ].join(' ')}
          >
            {highlight}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-8">
        {job.disabled ? (
          <p className="border-t border-black/10 pt-5 text-sm text-gray-500">
            Für diesen Aufgabenbereich besteht aktuell kein weiterer Bedarf.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => onApply(job.id)}
            className="inline-flex w-full items-center justify-between rounded-full bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800"
          >
            Für diese Position bewerben
            <span className="text-lg" aria-hidden="true">
              →
            </span>
          </button>
        )}
      </div>
    </article>
  );
}

export default function JobsPage({ session }: { session: Session }) {
  const [selectedJob, setSelectedJob] = useState<JobId | ''>('');

  function selectJob(jobId: JobId) {
    setSelectedJob(jobId);

    requestAnimationFrame(() => {
      document.getElementById('bewerbung')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <HtmlHead title="Weinzelt – Jobs & Bewerbung" />

      <Navbar session={session} />

      <main>
        {/* Hero */}
        <section className="relative min-h-[650px] overflow-hidden bg-stone-950 text-white sm:min-h-[720px]">
          <Image
            src="/jobs.jpg"
            alt="Das Team im Weinzelt auf der Rheinkirmes"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

          <div className="relative mx-auto flex min-h-[650px] max-w-7xl items-end px-4 pb-14 pt-24 sm:min-h-[720px] sm:pb-20">
            <div className="w-full">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
                Arbeiten im Weinzelt
              </p>

              <h1 className="mt-5 max-w-4xl text-4xl font-cocogoose leading-[1.05] sm:text-6xl md:text-7xl">
                Werde Teil
                <br />
                unseres Teams.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-xl">
                Du arbeitest gerne mit Menschen, behältst auch im Trubel den
                Überblick und hast Lust auf zehn besondere Tage mitten auf der
                Düsseldorfer Rheinkirmes? Dann möchten wir dich kennenlernen.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#stellen"
                  className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 font-semibold text-black transition hover:bg-stone-200"
                >
                  Offene Stellen ansehen
                </Link>

                <Link
                  href="#bewerbung"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Direkt bewerben
                </Link>
              </div>

              <div className="mt-10 grid max-w-4xl gap-3 sm:grid-cols-3">
                <InfoPill label="Zeitraum" value="17. bis 26. Juli 2026" />

                <InfoPill
                  label="Verfügbarkeit"
                  value="Mindestens 5 Einsatztage"
                />

                <InfoPill label="Einsatzort" value="Rheinkirmes Düsseldorf" />
              </div>
            </div>
          </div>
        </section>

        {/* Einführung */}
        <section className="px-4 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                Gemeinsam Gastgeber sein
              </p>

              <h2 className="mt-4 text-4xl font-cocogoose leading-tight text-black sm:text-5xl">
                Gute Stimmung beginnt hinter den Kulissen.
              </h2>

              <p className="mt-6 text-lg leading-relaxed text-gray-600">
                Das Weinzelt ist Treffpunkt, Weinbar, Restaurant und
                Party-Location zugleich. Damit unsere Gäste eine besondere Zeit
                erleben, braucht es ein Team, das sich aufeinander verlassen
                kann.
              </p>

              <p className="mt-5 text-lg leading-relaxed text-gray-600">
                Wir suchen motivierte Menschen, die Verantwortung übernehmen,
                freundlich auftreten und auch dann den Überblick behalten, wenn
                es voll wird. Pünktlichkeit, Zuverlässigkeit und Eigeninitiative
                sind für uns genauso wichtig wie Erfahrung.
              </p>

              <p className="mt-7 text-xl font-semibold leading-relaxed text-black">
                Kein Tag ist wie der andere – und genau das macht es aus.
              </p>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[2rem]">
                <Image
                  src="/home/partyByDay.jpg"
                  alt="Gäste und Team im Weinzelt"
                  width={1200}
                  height={900}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>

              <div className="absolute -bottom-6 -left-2 max-w-xs rounded-[1.5rem] bg-black p-6 text-white shadow-xl sm:-left-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                  Was zählt
                </p>

                <p className="mt-3 text-lg font-semibold leading-relaxed">
                  Zusammenhalt, Verlässlichkeit und Freude daran, Menschen eine
                  gute Zeit zu bereiten.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Vorteile */}
        <section className="bg-stone-100 px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                Das erwartet dich
              </p>

              <h2 className="mt-4 text-4xl font-cocogoose leading-tight text-black sm:text-5xl">
                Intensiv, abwechslungsreich
                <br />
                und definitiv nicht langweilig.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <BenefitCard
                number="01"
                title="Ein starkes Team"
                description="Du arbeitest mit Menschen aus unterschiedlichen Bereichen, die gemeinsam anpacken und sich gegenseitig unterstützen."
              />

              <BenefitCard
                number="02"
                title="Mitten im Geschehen"
                description="Dein Arbeitsplatz liegt direkt auf der Düsseldorfer Rheinkirmes – zwischen Wein, Musik und besonderer Atmosphäre."
              />

              <BenefitCard
                number="03"
                title="Klare Verantwortung"
                description="Du erhältst einen festen Aufgabenbereich, klare Abläufe und die Möglichkeit, selbstständig Verantwortung zu übernehmen."
              />
            </div>
          </div>
        </section>

        {/* Stellen */}
        <section id="stellen" className="scroll-mt-28 px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                  Offene Stellen
                </p>

                <h2 className="mt-4 text-4xl font-cocogoose leading-tight text-black sm:text-5xl">
                  Wo möchtest du mit anpacken?
                </h2>

                <p className="mt-5 text-lg leading-relaxed text-gray-600">
                  Wähle den Aufgabenbereich, der am besten zu deiner Erfahrung
                  und deinen Stärken passt.
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Weinzelt 2026 · Düsseldorf
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} onApply={selectJob} />
              ))}
            </div>
          </div>
        </section>

        {/* Bewerbung */}
        <section
          id="bewerbung"
          className="scroll-mt-28 bg-stone-950 px-4 py-20 text-white sm:py-28"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-32">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/45">
                Jetzt bewerben
              </p>

              <h2 className="mt-4 text-4xl font-cocogoose leading-tight sm:text-5xl">
                Erzähl uns kurz,
                <br />
                wer du bist.
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
                Für die erste Bewerbung benötigen wir nur deine Kontaktdaten,
                den gewünschten Aufgabenbereich und eine kurze Angabe zu deiner
                Verfügbarkeit.
              </p>

              <div className="mt-8 space-y-4 border-t border-white/10 pt-7 text-sm text-white/65">
                <div className="flex gap-3">
                  <span className="font-semibold text-white">01</span>
                  <p>Formular ausfüllen und absenden.</p>
                </div>

                <div className="flex gap-3">
                  <span className="font-semibold text-white">02</span>
                  <p>Wir prüfen deine Angaben.</p>
                </div>

                <div className="flex gap-3">
                  <span className="font-semibold text-white">03</span>
                  <p>Wir melden uns persönlich bei dir.</p>
                </div>
              </div>
            </div>

            <ApplicationForm
              selectedJob={selectedJob}
              onSelectedJobChange={setSelectedJob}
            />
          </div>
        </section>

        {/* Alternative Kontaktmöglichkeiten */}
        <section className="bg-stone-100 px-4 py-20">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-white p-7 shadow-sm sm:p-10 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
                Noch Fragen?
              </p>

              <h2 className="mt-3 text-3xl font-cocogoose text-black sm:text-4xl">
                Schreib uns einfach direkt.
              </h2>

              <p className="mt-3 max-w-xl leading-relaxed text-gray-600">
                Du kannst dich alternativ auch per E-Mail oder über Instagram
                bei uns melden.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:jobs@dasweinzelt.de"
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
              >
                E-Mail schreiben
              </a>

              <Link
                href="https://www.instagram.com/weinzelt.dus/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-black/10 px-6 py-3 font-semibold text-black transition hover:bg-stone-100"
              >
                Zu Instagram
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ApplicationForm({
  selectedJob,
  onSelectedJobChange,
}: {
  selectedJob: JobId | '';
  onSelectedJobChange: (job: JobId | '') => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [availability, setAvailability] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const activeJobs = jobs.filter((job) => !job.disabled);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !availability.trim() || !selectedJob) {
      setStatus('error');
      setErrorMessage('Bitte fülle alle Pflichtfelder aus.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      await axios.post('/api/jobApplication', {
        name: name.trim(),
        email: email.trim(),
        availability: availability.trim(),
        selectedJob,
      });

      setStatus('success');
      setName('');
      setEmail('');
      setAvailability('');
      onSelectedJobChange('');
    } catch (error) {
      let message =
        'Deine Bewerbung konnte gerade nicht gesendet werden. Bitte versuche es erneut.';

      if (axios.isAxiosError(error)) {
        const responseMessage =
          error.response?.data?.message ?? error.response?.data?.error;

        if (typeof responseMessage === 'string') {
          message = responseMessage;
        }
      }

      setStatus('error');
      setErrorMessage(message);
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-[2rem] bg-white p-7 text-center text-black shadow-2xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
          ✓
        </div>

        <h3 className="mt-6 text-3xl font-cocogoose">Bewerbung gesendet!</h3>

        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-gray-600">
          Vielen Dank für dein Interesse am Weinzelt. Wir haben deine Angaben
          erhalten und melden uns bei dir.
        </p>

        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
        >
          Weitere Bewerbung senden
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] bg-white p-6 text-black shadow-2xl sm:p-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">
          Bewerbungsformular
        </p>

        <h3 className="mt-3 text-3xl font-cocogoose">Deine Kurzbewerbung</h3>

        <p className="mt-3 leading-relaxed text-gray-600">
          Alle mit einem Stern markierten Felder sind erforderlich.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="application-name"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Name *
          </label>

          <input
            id="application-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Vor- und Nachname"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div>
          <label
            htmlFor="application-email"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            E-Mail-Adresse *
          </label>

          <input
            id="application-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="du@example.com"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div>
          <label
            htmlFor="application-job"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Gewünschter Aufgabenbereich *
          </label>

          <select
            id="application-job"
            required
            value={selectedJob}
            onChange={(event) =>
              onSelectedJobChange(event.target.value as JobId | '')
            }
            className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
          >
            <option value="">Bitte auswählen</option>

            {activeJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.icon} {job.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="application-availability"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Verfügbarkeit vom 17. bis 26. Juli 2026 *
          </label>

          <textarea
            id="application-availability"
            required
            rows={4}
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            placeholder="Zum Beispiel: 18., 19., 21., 24. und 25. Juli ganztägig verfügbar."
            className="w-full resize-y rounded-2xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
          />

          <p className="mt-2 text-xs text-gray-500">
            Bitte nenne möglichst konkrete Tage oder Zeiträume.
          </p>
        </div>

        {status === 'error' && (
          <p
            role="alert"
            className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={
            status === 'loading' ||
            !name.trim() ||
            !email.trim() ||
            !availability.trim() ||
            !selectedJob
          }
          className="inline-flex w-full items-center justify-center rounded-full bg-black px-6 py-4 font-semibold text-white shadow-md transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'loading'
            ? 'Bewerbung wird gesendet …'
            : 'Bewerbung absenden'}
        </button>

        <p className="text-center text-xs leading-relaxed text-gray-500">
          Mit dem Absenden übermittelst du uns deine Angaben zur Bearbeitung
          deiner Bewerbung. Weitere Informationen findest du in unseren{' '}
          <Link
            href="/privacy"
            className="text-black underline underline-offset-2"
          >
            Datenschutzhinweisen
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
