import Link from 'next/link';
import InstagramIcon from '@mui/icons-material/Instagram';

export default function Footer() {
  return (
    <footer className="bg-black text-white text-sm pt-6 pb-16 sm:pb-8 px-4">
      <div className="w-full max-w-6xl mx-auto flex gap-5 flex-col sm:flex-row items-center sm:justify-between">
        <div>
          <p>&copy; 2025 Weinzelt GmbH</p>
          <div className="mt-2">
            <Link href="/imprint" className="underline mr-2">
              Impressum
            </Link>
            <Link href="/privacy" className="underline">
              Datenschutz
            </Link>
          </div>
        </div>
        <div className="flex gap-5 items-center text-3xl">
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
            <img src="/icons/tiktok.png" alt="TikTok" className="w-7 h-7" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
