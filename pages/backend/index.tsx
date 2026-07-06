// /pages/backend/index.tsx
import { Session } from '@/hooks/useSession';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import BackendKpiSection from '@/components/backend/kpiSection';
import {
  backendMenuItems,
  groupBackendMenuItems,
} from '@/components/backend/backendMenuItems';
import {
  BACKEND_PERMISSIONS,
  BackendPermissionKey,
} from '@/lib/backend/permissions';

type MePermissionsResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
  };
  permissions: BackendPermissionKey[];
};

export default function Backend({ session }: { session: Session }) {
  const router = useRouter();
  const [permissions, setPermissions] = useState<BackendPermissionKey[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady, router]);

  useEffect(() => {
    if (session.status !== 'authenticated') return;

    let cancelled = false;

    async function loadPermissions() {
      setIsLoadingPermissions(true);

      try {
        const response = await fetch('/api/backend/me/permissions');

        if (!response.ok) {
          throw new Error('Permissions konnten nicht geladen werden.');
        }

        const data = (await response.json()) as MePermissionsResponse;

        if (!cancelled) {
          setPermissions(data.permissions);
        }
      } catch (error) {
        console.error('[backend] load permissions failed:', error);

        if (!cancelled) {
          setPermissions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPermissions(false);
        }
      }
    }

    loadPermissions();

    return () => {
      cancelled = true;
    };
  }, [session.status]);

  const allowedPermissionSet = useMemo(
    () => new Set<BackendPermissionKey>(permissions),
    [permissions],
  );

  const visibleMenuItems = useMemo(
    () =>
      backendMenuItems.filter((item) =>
        allowedPermissionSet.has(item.permission),
      ),
    [allowedPermissionSet],
  );

  const groupedItems = useMemo(
    () => groupBackendMenuItems(visibleMenuItems),
    [visibleMenuItems],
  );

  const canSeeDashboard = allowedPermissionSet.has(
    BACKEND_PERMISSIONS.DASHBOARD,
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col items-center text-center gap-3">
        <img src="/logo.png" alt="WEINZELT" className="w-56" />

        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400 mb-3">
            Backend
          </p>
          <h1 className="text-3xl font-semibold text-gray-950">
            Hallo {session.user?.name}
          </h1>
          <p className="mt-2 text-gray-500">
            Noch{' '}
            <b>
              {Math.round(
                Math.max(
                  0,
                  (new Date('2026-07-17T14:00').getTime() -
                    new Date().getTime()) /
                    1000 /
                    60 /
                    60 /
                    24,
                ),
              )}{' '}
              Tage
            </b>{' '}
            bis zum Weinzelt
          </p>
        </div>
      </header>

      {canSeeDashboard && <BackendKpiSection />}

      {isLoadingPermissions ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
          Backend werden geladen...
        </div>
      ) : visibleMenuItems.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Für deinen Account wurden noch keine Backend-Bereiche freigegeben.
        </div>
      ) : (
        <section className="flex flex-col gap-8">
          {Object.entries(groupedItems).map(([group, items]) => (
            <div key={group} className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">{group}</h2>
                <div className="mt-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((item) => (
                  <LinkItem key={item.href} {...item} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function LinkItem({
  href,
  title,
  description,
  Icon,
}: {
  href: string;
  title: string;
  description: string;
  Icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition group-hover:bg-gray-950 group-hover:text-white">
          <Icon fontSize="small" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-950">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
