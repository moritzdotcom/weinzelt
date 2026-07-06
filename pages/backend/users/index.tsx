// /pages/backend/users/index.tsx

import { Session } from '@/hooks/useSession';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import BackendPermissionGuard from '@/components/backend/BackendPermissionGuard';
import { BACKEND_PERMISSIONS } from '@/lib/backend/permissions';

type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  permissions: string[];
};

type UsersResponse = {
  users: BackendUser[];
};

type CreateUserResponse = {
  user: BackendUser;
  inviteMailSent: boolean;
  inviteMailError?: string | null;
  temporaryPassword?: string;
};

export default function BackendUsersPage({ session }: { session: Session }) {
  const router = useRouter();

  const [users, setUsers] = useState<BackendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady, router]);

  async function loadUsers() {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/backend/users');

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error || 'Benutzer konnten nicht geladen werden.',
        );
      }

      const data = (await response.json()) as UsersResponse;
      setUsers(data.users);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Benutzer konnten nicht geladen werden.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (session.status !== 'authenticated') return;
    loadUsers();
  }, [session.status]);

  async function handleUserCreated(response: CreateUserResponse) {
    setUsers((current) => [...current, response.user]);
    setCreateModalOpen(false);

    if (response.temporaryPassword) {
      setCreatedPassword(response.temporaryPassword);
    }

    await loadUsers();
  }

  return (
    <BackendPermissionGuard
      session={session}
      permission={BACKEND_PERMISSIONS.USERS}
      deniedTitle="Kein Zugriff auf Benutzer"
      deniedDescription="Du hast keine Berechtigung, Benutzer im Backend zu verwalten."
    >
      <div className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/backend"
              className="text-sm font-medium text-gray-500 hover:text-gray-950"
            >
              ← Zurück zum Backend
            </Link>

            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-gray-400">
              Setup
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-gray-950">
              Benutzer & Rechte
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              Lege Backend-Benutzer an und steuere, welche Bereiche im Backend
              sichtbar und nutzbar sind.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            <AddRoundedIcon fontSize="small" />
            Benutzer einladen
          </button>
        </header>

        {createdPassword && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
            <p className="font-semibold">Vorläufiges Passwort</p>
            <p className="mt-1">
              Die Einladung konnte nicht per Mail versendet werden oder wurde
              nicht aktiviert. Gib dem Benutzer dieses Passwort manuell:
            </p>
            <code className="mt-3 block rounded-xl bg-white px-3 py-2 font-mono text-sm">
              {createdPassword}
            </code>
            <button
              type="button"
              onClick={() => setCreatedPassword(null)}
              className="mt-3 text-sm font-semibold text-amber-950 underline"
            >
              Ausblenden
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-950">
              Alle Benutzer
            </h2>
          </div>

          {isLoading ? (
            <div className="p-5 text-sm text-gray-500">
              Benutzer werden geladen...
            </div>
          ) : users.length === 0 ? (
            <div className="p-5 text-sm text-gray-500">
              Es wurden noch keine Benutzer angelegt.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      {user.role === 'ADMIN' ? (
                        <AdminPanelSettingsRoundedIcon fontSize="small" />
                      ) : (
                        <LockRoundedIcon fontSize="small" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-950">
                          {user.name}
                        </h3>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                          {user.role === 'ADMIN' ? 'Admin' : 'User'}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">{user.email}</p>

                      <p className="mt-1 text-xs text-gray-400">
                        {user.role === 'ADMIN'
                          ? 'Vollzugriff'
                          : `${user.permissions.length} Bereiche freigeschaltet`}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/backend/users/${user.id}/permissions`}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    Berechtigungen bearbeiten
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {createModalOpen && (
          <CreateUserModal
            onClose={() => setCreateModalOpen(false)}
            onCreated={handleUserCreated}
          />
        )}
      </div>
    </BackendPermissionGuard>
  );
}

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (response: CreateUserResponse) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sendInvite, setSendInvite] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/backend/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password: password || undefined,
          sendInvite,
          permissions: [],
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || 'Benutzer konnte nicht erstellt werden.',
        );
      }

      onCreated(data as CreateUserResponse);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Benutzer konnte nicht erstellt werden.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-semibold text-gray-950">
            Benutzer einladen
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Der Benutzer wird zunächst ohne Berechtigungen angelegt. Danach
            kannst du die freigeschalteten Bereiche bearbeiten.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-950"
              placeholder="Max Mustermann"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">E-Mail</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-950"
              placeholder="max@example.com"
              type="email"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">
              Passwort optional
            </span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-950"
              placeholder="Leer lassen für automatisch generiertes Passwort"
              type="password"
            />
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-gray-200 p-4">
            <input
              type="checkbox"
              checked={sendInvite}
              onChange={(event) => setSendInvite(event.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-gray-900">
                Einladung per Mail senden
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                Der Benutzer erhält den Login-Link und das vorläufige Passwort.
              </span>
            </span>
          </label>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Wird erstellt...' : 'Benutzer erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
