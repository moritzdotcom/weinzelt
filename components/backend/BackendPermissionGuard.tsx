// /components/backend/BackendPermissionGuard.tsx

import { ReactNode } from 'react';
import { Session } from '@/hooks/useSession';
import { BackendPermissionKey } from '@/lib/backend/permissions';
import { useBackendPermission } from '@/hooks/useBackendPermission';
import BackendAccessDenied from '@/components/backend/AccessDenied';
import BackendPageLoading from '@/components/backend/BackendPageLoading';

export default function BackendPermissionGuard({
  session,
  permission,
  children,
  deniedTitle,
  deniedDescription,
}: {
  session: Session;
  permission: BackendPermissionKey;
  children: ReactNode;
  deniedTitle?: string;
  deniedDescription?: string;
}) {
  const auth = useBackendPermission({
    session,
    permission,
  });

  if (auth.isChecking) {
    return <BackendPageLoading />;
  }

  if (!auth.isAllowed) {
    return (
      <BackendAccessDenied
        title={deniedTitle}
        description={deniedDescription}
      />
    );
  }

  return <>{children}</>;
}
