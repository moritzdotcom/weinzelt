import InstagramIcon from '@mui/icons-material/Instagram';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black px-4 pb-24 pt-14 text-sm text-white md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <img
            src="/logo-sm.png"
            alt="Weinzelt"
            className="w-44 brightness-0 invert"
          />
          <p className="mt-5 max-w-sm leading-relaxed text-white/65">
            Wein, Beats und Düsseldorf auf der Rheinkirmes. Vom entspannten
            Daydrinking bis zur Nacht auf der Tanzfläche.
          </p>
        </div>

        <div>
          <p className="font-semibold uppercase tracking-[0.2em] text-white/45">
            Entdecken
          </p>
          <div className="mt-4 flex flex-col gap-3 text-white/80">
            <Link href="/#programm" className="hover:text-white">
              Programm
            </Link>
            <Link href="/#wine-events" className="hover:text-white">
              WineEvents
            </Link>
            <Link href="/#gastro" className="hover:text-white">
              Speisen & Getränke
            </Link>
            <Link href="/impressions" className="hover:text-white">
              Fotogalerie
            </Link>
          </div>
        </div>

        <div>
          <p className="font-semibold uppercase tracking-[0.2em] text-white/45">
            Besuch
          </p>
          <div className="mt-4 space-y-2 text-white/80">
            <p>17.–26. Juli 2026</p>
            <p>Rheinkirmes Düsseldorf</p>
            <p>Eintritt frei</p>
          </div>
          <Link
            href="/reservation"
            className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 font-semibold text-black transition hover:bg-stone-200"
          >
            Reservieren
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-5 border-t border-white/10 pt-6 text-white/55 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p>&copy; 2026 Weinzelt GmbH</p>
          <div className="mt-2 flex gap-4">
            <Link href="/imprint" className="hover:text-white">
              Impressum
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Datenschutz
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-5 text-3xl text-white">
          <Link
            href="https://www.instagram.com/weinzelt.dus/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Weinzelt auf Instagram"
          >
            <InstagramIcon fontSize="inherit" />
          </Link>
          <Link
            href="https://www.tiktok.com/@weinzelt"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Weinzelt auf TikTok"
          >
            <img src="/icons/tiktok.png" alt="" className="h-7 w-7" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
