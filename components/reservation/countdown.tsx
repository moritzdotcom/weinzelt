import { ReactNode, useEffect, useState } from 'react';
import Countdown from '@/components/countdown';
import Link from 'next/link';

interface CountdownSectionProps {
  startDate: string;
  logoSrc?: string;
  preMessage?: ReactNode;
  children: ReactNode;
}

export default function ReservationCountdownSection({
  startDate,
  logoSrc = '/logo.png',
  preMessage,
  children,
}: CountdownSectionProps) {
  const target = new Date(startDate).getTime();
  const [showCountdown, setShowCountdown] = useState(Date.now() < target);

  useEffect(() => {
    const timer = setInterval(() => {
      setShowCountdown(Date.now() < target);
    }, 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (showCountdown) {
    return (
      <section
        id="countdown"
        className="h-screen flex items-center bg-gradient-to-tr from-gray-100 to-blue-100 text-black text-center px-4"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <Link href="/">
            <img src={logoSrc} alt="Logo" className="w-80 h-auto mb-4" />
          </Link>
          {preMessage ?? (
            <p className="text-xl md:text-2xl">
              Reservierungsanfragen können ab dem{' '}
              <b>
                {new Date(startDate).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </b>{' '}
              abgegeben werden.
            </p>
          )}
          <Countdown targetDate={startDate} />
          <p className="mt-6 text-center text-gray-600">
            Reservierungsanfragen für Firmen oder größere Gruppen können{' '}
            <b>bereits jetzt</b> schon über unser{' '}
            <a
              href="/reservation/company"
              className="text-black font-medium underline"
            >
              Kontaktformular
            </a>{' '}
            oder per Mail an{' '}
            <a
              href="mailto:reservierung@dasweinzelt.de"
              className="text-black font-medium underline"
            >
              reservierung@dasweinzelt.de
            </a>{' '}
            gestellt werden.
          </p>
          <Link href="/" className="underline text-lg">
            Zurück zur Startseite
          </Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
