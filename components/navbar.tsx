import { Session } from '@/hooks/useSession';
import { Drawer, Divider, Collapse, IconButton } from '@mui/material';
import Link from 'next/link';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import { useLayoutEffect, useRef, useState } from 'react';

export default function Navbar({ session }: { session: Session }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // 1) einmal initial und bei jeder Änderung von session.status nachmessen
  useLayoutEffect(() => {
    const measure = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.clientHeight);
      }
    };

    // direkt nach Mount
    measure();

    // bei Resize nachmessen
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [session.status]);

  return (
    <>
      <header ref={headerRef} className="fixed w-full bg-white shadow z-50">
        {session.status == 'authenticated' && (
          <div className="w-full bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between">
              <p className="font-bold">Hallo {session.user.name}!</p>
              <Link
                href="/backend"
                className="flex items-center gap-1 underline"
              >
                Zur Admin Seite
              </Link>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/#">
            <img src="/logo-sm.png" alt="WEINZELT" className="w-32 sm:w-40" />
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="/#vip">VIP</Link>
            <Link href="/#musik">Musik</Link>
            <Link href="/#gastro">Getränke</Link>
            <Link href="/about">Über uns</Link>
            <Link href="/jobs">Jobs</Link>
            <Link href="/impressions">Fotos</Link>
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
          <div className="p-5 flex flex-col justify-between text-left text-xl min-w-[80vw] h-full">
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <IconButton onClick={() => setMenuOpen(false)}>
                  <CloseIcon fontSize="large" />
                </IconButton>
              </div>

              {/* START Dropdown */}
              <div>
                <button
                  className="w-full flex items-center justify-between"
                  onClick={() => setStartOpen((prev) => !prev)}
                >
                  <span className="text-left">Start</span>
                  {startOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </button>
                <Collapse in={startOpen} timeout="auto" unmountOnExit>
                  <div className="flex flex-col gap-3 mt-3 ml-3 text-neutral-500">
                    <Link href="/#vip" onClick={() => setMenuOpen(false)}>
                      VIP-Tische
                    </Link>
                    <Divider />
                    <Link
                      href="/#standing-tables"
                      onClick={() => setMenuOpen(false)}
                    >
                      Stehtische
                    </Link>
                    <Divider />
                    <Link href="/#musik" onClick={() => setMenuOpen(false)}>
                      Musik & Events
                    </Link>
                    <Divider />
                    <Link href="/#gastro" onClick={() => setMenuOpen(false)}>
                      Speisen & Getränke
                    </Link>
                    <Divider />
                    <Link href="/#partner" onClick={() => setMenuOpen(false)}>
                      Partner
                    </Link>
                  </div>
                </Collapse>
              </div>

              <Divider />

              {/* Die restlichen Menüpunkte */}
              <Link href="/about" onClick={() => setMenuOpen(false)}>
                Über uns
              </Link>
              <Divider />
              <Link href="/jobs" onClick={() => setMenuOpen(false)}>
                Jobs
              </Link>
              <Divider />
              <Link href="/reservation" onClick={() => setMenuOpen(false)}>
                Tisch reservieren
              </Link>
              <Divider />
              <Link href="/impressions" onClick={() => setMenuOpen(false)}>
                Fotos
              </Link>
            </div>

            {/* Social Icons */}
            <div className="mx-auto flex gap-5 items-center text-4xl">
              <Link
                href="https://www.instagram.com/weinzelt.dus/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon fontSize="inherit" />
              </Link>
              <Link
                href="https://www.tiktok.com/@weinzelt"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/icons/tiktok.png" alt="TikTok" className="w-8 h-8" />
              </Link>
            </div>
          </div>
        </Drawer>
      </header>
      <div style={{ height: headerHeight || 60 }} />
    </>
  );
}
