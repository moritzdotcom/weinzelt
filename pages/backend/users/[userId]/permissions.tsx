// /pages/backend/users/[userId]/permissions.tsx
import { Session } from '@/hooks/useSession';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import {
  backendMenuItems,
  groupBackendMenuItems,
} from '@/components/backend/backendMenuItems';
import {
  ALL_BACKEND_PERMISSIONS,
  BACKEND_PERMISSIONS,
  BackendPermissionKey,
} from '@/lib/backend/permissions';
import BackendPermissionGuard from '@/components/backend/BackendPermissionGuard';

type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  permissions: BackendPermissionKey[];
};

type PermissionResponse = {
  user: BackendUser;
};

function areSamePermissions(
  a: BackendPermissionKey[],
  b: BackendPermissionKey[],
) {
  if (a.length !== b.length) return false;

  const aSet = new Set(a);

  return b.every((permission) => aSet.has(permission));
}

export default function BackendUserPermissionsPage({
  session,
}: {
  session: Session;
}) {
  const router = useRouter();
  const { userId } = router.query;

  const [user, setUser] = useState<BackendUser | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<
    BackendPermissionKey[]
  >([]);
  const [initialPermissions, setInitialPermissions] = useState<
    BackendPermissionKey[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!router.isReady) return;

    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady, router]);

  async function loadPermissions(id: string) {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/backend/users/${id}/permissions`);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || 'Berechtigungen konnten nicht geladen werden.',
        );
      }

      const result = data as PermissionResponse;

      setUser(result.user);
      setSelectedPermissions(result.user.permissions);
      setInitialPermissions(result.user.permissions);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Berechtigungen konnten nicht geladen werden.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (session.status !== 'authenticated') return;
    if (typeof userId !== 'string') return;

    loadPermissions(userId);
  }, [session.status, userId]);

  const selectedSet = useMemo(
    () => new Set<BackendPermissionKey>(selectedPermissions),
    [selectedPermissions],
  );

  const groupedItems = useMemo(
    () => groupBackendMenuItems(backendMenuItems),
    [],
  );

  const isAdmin = user?.role === 'ADMIN';

  const hasChanges = useMemo(
    () => !areSamePermissions(selectedPermissions, initialPermissions),
    [selectedPermissions, initialPermissions],
  );

  function setAll(enabled: boolean) {
    if (isAdmin) return;

    setSuccess('');

    setSelectedPermissions(enabled ? [...ALL_BACKEND_PERMISSIONS] : []);
  }

  function setGroup(group: string, enabled: boolean) {
    if (isAdmin) return;

    setSuccess('');

    const groupPermissions = backendMenuItems
      .filter((item) => item.group === group)
      .map((item) => item.permission);

    setSelectedPermissions((current) => {
      const next = new Set(current);

      for (const permission of groupPermissions) {
        if (enabled) {
          next.add(permission);
        } else {
          next.delete(permission);
        }
      }

      return Array.from(next);
    });
  }

  function togglePermission(permission: BackendPermissionKey) {
    if (isAdmin) return;

    setSuccess('');

    setSelectedPermissions((current) => {
      const next = new Set(current);

      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }

      return Array.from(next);
    });
  }

  async function savePermissions() {
    if (!user || isAdmin) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `/api/backend/users/${user.id}/permissions`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permissions: selectedPermissions,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || 'Berechtigungen konnten nicht gespeichert werden.',
        );
      }

      const result = data as PermissionResponse;

      setUser(result.user);
      setSelectedPermissions(result.user.permissions);
      setInitialPermissions(result.user.permissions);
      setSuccess('Berechtigungen wurden gespeichert.');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Berechtigungen konnten nicht gespeichert werden.',
      );
    } finally {
      setIsSaving(false);
    }
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
              href="/backend/users"
              className="text-sm font-medium text-gray-500 hover:text-gray-950"
            >
              ← Zurück zu Benutzer & Rechte
            </Link>

            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-gray-400">
              Berechtigungen
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-gray-950">
              {user ? user.name : 'Benutzer'}
            </h1>

            {user && (
              <p className="mt-2 text-sm text-gray-500">
                {user.email} · {user.role === 'ADMIN' ? 'Admin' : 'User'}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAll(true)}
              disabled={isAdmin}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Alle aktivieren
            </button>

            <button
              type="button"
              onClick={() => setAll(false)}
              disabled={isAdmin}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Alle deaktivieren
            </button>

            <button
              type="button"
              onClick={savePermissions}
              disabled={!hasChanges || isSaving || isAdmin}
              className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </header>

        {isAdmin && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
            Dieser Benutzer ist Admin und hat automatisch Zugriff auf alle
            Backend-Bereiche. Einzelne Kacheln müssen nicht freigeschaltet
            werden.
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-700">
            {success}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            Berechtigungen werden geladen...
          </div>
        ) : (
          <section className="flex flex-col gap-8">
            {Object.entries(groupedItems).map(([group, items]) => (
              <div key={group} className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-950">
                      {group}
                    </h2>
                    <div className="mt-1 h-px bg-gray-200" />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGroup(group, true)}
                      disabled={isAdmin}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Alle aktivieren
                    </button>

                    <button
                      type="button"
                      onClick={() => setGroup(group, false)}
                      disabled={isAdmin}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Alle deaktivieren
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => {
                    const enabled = isAdmin || selectedSet.has(item.permission);

                    return (
                      <button
                        key={item.permission}
                        type="button"
                        onClick={() => togglePermission(item.permission)}
                        disabled={isAdmin}
                        className={[
                          'group rounded-2xl border bg-white p-5 text-left shadow-sm transition',
                          enabled
                            ? 'border-gray-950 ring-1 ring-gray-950'
                            : 'border-gray-200 hover:border-gray-300',
                          isAdmin
                            ? 'cursor-not-allowed opacity-80'
                            : 'hover:-translate-y-0.5 hover:shadow-md',
                        ].join(' ')}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={[
                              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition',
                              enabled
                                ? 'bg-gray-950 text-white'
                                : 'bg-gray-100 text-gray-700',
                            ].join(' ')}
                          >
                            <item.Icon fontSize="small" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-base font-semibold text-gray-950">
                                {item.title}
                              </h3>

                              <span
                                className={[
                                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                                  enabled
                                    ? 'border-gray-950 bg-gray-950 text-white'
                                    : 'border-gray-300 bg-white text-transparent',
                                ].join(' ')}
                              >
                                <CheckRoundedIcon sx={{ fontSize: 16 }} />
                              </span>
                            </div>

                            <p className="mt-1 text-sm leading-relaxed text-gray-500">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </BackendPermissionGuard>
  );
}
