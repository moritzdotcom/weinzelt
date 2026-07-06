// /hooks/useBackendPermission.ts
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Session } from '@/hooks/useSession';
import { BackendPermissionKey } from '@/lib/backend/permissions';

type MePermissionsResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
  };
  permissions: BackendPermissionKey[];
};

export function useBackendPermission({
  session,
  permission,
}: {
  session: Session;
  permission: BackendPermissionKey;
}) {
  const router = useRouter();

  const [permissions, setPermissions] = useState<BackendPermissionKey[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = session.status === 'authenticated';
  const isUnauthenticated = session.status === 'unauthenticated';

  useEffect(() => {
    if (!router.isReady) return;

    if (isUnauthenticated) {
      router.replace('/backend/login');
    }
  }, [router, router.isReady, isUnauthenticated]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!isAuthenticated) return;

    let cancelled = false;

    async function loadPermissions() {
      setIsLoadingPermissions(true);
      setError(null);

      try {
        const { data } = await axios.get<MePermissionsResponse>(
          '/api/backend/me/permissions',
        );

        if (!cancelled) {
          setPermissions(data.permissions);
        }
      } catch (error) {
        console.error('[useBackendPermission] failed:', error);

        if (!cancelled) {
          setPermissions([]);
          setError('Berechtigungen konnten nicht geladen werden.');
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
  }, [router.isReady, isAuthenticated]);

  const permissionSet = useMemo(
    () => new Set<BackendPermissionKey>(permissions),
    [permissions],
  );

  const isAllowed = permissionSet.has(permission);

  const isChecking =
    !router.isReady ||
    session.status === 'loading' ||
    isLoadingPermissions ||
    isUnauthenticated;

  return {
    isChecking,
    isAllowed,
    permissions,
    error,
  };
}
