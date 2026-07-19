import { Session } from '@/hooks/useSession';
import { Divider, Drawer, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InstagramIcon from '@mui/icons-material/Instagram';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';

const navigation = [
  { href: '/#programm', label: 'Programm' },
  { href: '/#wine-events', label: 'WineEvents' },
  { href: '/#gastro', label: 'Speisen & Getränke' },
  { href: '/about', label: 'Über Uns' },
  { href: '/impressions', label: 'Fotos' },
  { href: '/jobs', label: 'Jobs' },
];

export default function Navbar({ session }: { session: Session }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const measure = () => setHeaderHeight(header.clientHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(header);

    return () => observer.disconnect();
  }, [session.status]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/95 shadow-sm backdrop-blur-lg"
      >
        {session.status === 'authenticated' && (
          <div className="w-full bg-stone-100">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1 text-sm">
              <p className="font-semibold">Hallo {session.user.name}!</p>
              <Link href="/backend" className="underline underline-offset-2">
                Zur Admin-Seite
              </Link>
            </div>
          </div>
        )}

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
          <Link href="/" aria-label="Zur Weinzelt Startseite">
            <img src="/logo-sm.png" alt="Weinzelt" className="w-32 sm:w-40" />
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-gray-500"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/reservation"
              className="rounded-full bg-black px-5 py-2.5 text-white shadow transition hover:bg-gray-800"
            >
              Reservieren
            </Link>
          </nav>

          <button
            type="button"
            aria-label="Navigation öffnen"
            aria-expanded={menuOpen}
            className="rounded-full p-2 transition hover:bg-stone-100 lg:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      <Drawer anchor="right" open={menuOpen} onClose={closeMenu}>
        <div className="flex h-full min-w-[84vw] max-w-sm flex-col p-5 sm:min-w-96">
          <div className="flex items-center justify-between">
            <img src="/logo-sm.png" alt="Weinzelt" className="w-36" />
            <IconButton onClick={closeMenu} aria-label="Navigation schließen">
              <CloseIcon fontSize="large" />
            </IconButton>
          </div>

          <Divider sx={{ my: 3 }} />

          <nav className="flex flex-col text-xl">
            {navigation.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  className="block py-3"
                >
                  {item.label}
                </Link>
                <Divider />
              </div>
            ))}

            <Link href="/about" onClick={closeMenu} className="block py-3">
              Über uns
            </Link>
          </nav>

          <Link
            href="/reservation"
            onClick={closeMenu}
            className="mt-6 rounded-full bg-black px-6 py-4 text-center font-semibold text-white"
          >
            Jetzt reservieren
          </Link>

          <div className="mt-auto flex items-center justify-center gap-6 pt-10 text-4xl">
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
              <img src="/icons/tiktok.png" alt="" className="h-8 w-8" />
            </Link>
          </div>
        </div>
      </Drawer>

      <div style={{ height: headerHeight || 68 }} />
    </>
  );
}
