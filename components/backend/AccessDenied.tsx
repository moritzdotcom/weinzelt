// /components/backend/AccessDenied.tsx

import Link from 'next/link';
import LockRoundedIcon from '@mui/icons-material/LockRounded';

export default function BackendAccessDenied({
  title = 'Kein Zugriff',
  description = 'Du hast keine Berechtigung, diesen Backend-Bereich aufzurufen.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
        <LockRoundedIcon />
      </div>

      <h1 className="mt-5 text-2xl font-semibold text-gray-950">{title}</h1>

      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        {description}
      </p>

      <Link
        href="/backend"
        className="mt-6 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Zurück zum Backend
      </Link>
    </div>
  );
}
