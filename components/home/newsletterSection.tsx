import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from '@mui/icons-material';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!acceptedPrivacy) {
      setStatus('error');
      setErrorMessage('Bitte bestätige kurz die Datenschutzhinweise.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Die Anmeldung ist fehlgeschlagen.');
      }

      setStatus('success');
      setEmail('');
      setName('');
      setAcceptedPrivacy(false);
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Die Anmeldung ist fehlgeschlagen.',
      );
    }
  }

  return (
    <section
      id="newsletter"
      className="relative overflow-hidden bg-stone-950 text-white px-4 py-20"
    >
      <div className="absolute inset-0">
        <img
          src="/home/champagne.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-stone-950/70 to-black" />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[5fr_4fr] gap-10 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl font-cocogoose mb-6">
            Keine News vom Weinzelt verpassen.
          </h2>

          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
            Trag dich ein und erfahre als Erstes, wenn Reservierungen starten,
            neue Events online gehen oder wir besondere Aktionen rund ums
            Weinzelt ankündigen.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 text-sm text-gray-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white mb-1">Early Access</p>
              <p>Reservierungen & Tickets zuerst sichern.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white mb-1">Specials</p>
              <p>Brunch, WineWalks & Tastings rechtzeitig entdecken.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white mb-1">Line-up</p>
              <p>DJs, Mottos & Highlights direkt ins Postfach.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white text-black shadow-2xl p-6 md:p-8">
          {status === 'success' ? (
            <div className="text-center py-10">
              <CheckCircle className="text-green-600 mb-4" fontSize="large" />
              <h3 className="text-2xl font-cocogoose mb-3">Fast geschafft!</h3>
              <p className="text-gray-700 leading-relaxed">
                Wir haben dir eine E-Mail geschickt. Bitte bestätige dort kurz
                deine Anmeldung zum Newsletter.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-white font-semibold hover:bg-gray-800 transition"
              >
                Weitere Adresse eintragen
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-cocogoose mb-2">
                Trag dich auf die Gästeliste ein.
              </h3>
              <p className="text-gray-600 mb-6">
                Newsletter abonnieren, E-Mail bestätigen und nichts mehr
                verpassen.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="newsletter-name"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    id="newsletter-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    type="text"
                    autoComplete="name"
                    placeholder="Dein Name"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newsletter-email"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    E-Mail Adresse
                  </label>
                  <input
                    id="newsletter-email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="du@example.com"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                  />
                </div>

                <label className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(event) =>
                      setAcceptedPrivacy(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <span>
                    Ich möchte den Weinzelt Newsletter erhalten und akzeptiere
                    die{' '}
                    <Link href="/privacy" className="underline text-black">
                      Datenschutzhinweise
                    </Link>
                    .
                  </span>
                </label>

                {status === 'error' && (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-full bg-black px-6 py-4 text-white font-semibold shadow-md hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 transition"
                >
                  {status === 'loading'
                    ? 'Wird angemeldet...'
                    : 'Newsletter abonnieren'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Kein Spam. Nur Updates rund ums Weinzelt.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
