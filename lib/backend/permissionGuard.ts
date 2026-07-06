// /lib/backend/permissionGuard.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prismadb';
import { getServerSession } from '@/lib/session';
import {
  ALL_BACKEND_PERMISSIONS,
  BackendPermissionKey,
  sanitizeBackendPermissions,
} from '@/lib/backend/permissions';

type PermissionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Array<{
    permission: string;
  }>;
};

export function getEffectiveBackendPermissionsForUser(user: PermissionUser) {
  if (user.role === UserRole.ADMIN) {
    return ALL_BACKEND_PERMISSIONS;
  }

  return sanitizeBackendPermissions(
    user.permissions.map((permission) => permission.permission),
  );
}

export async function getAuthenticatedBackendUser(req: NextApiRequest) {
  const session = await getServerSession(req);

  if (!session) return null;

  if (!session.id && !session.email) return null;

  const user = await prisma.user.findFirst({
    where: session.id ? { id: session.id } : { email: session.email! },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: {
        select: {
          permission: true,
        },
      },
    },
  });

  return user;
}

export async function hasBackendPermission(
  userId: string,
  permission: BackendPermissionKey,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: {
        select: {
          permission: true,
        },
      },
    },
  });

  if (!user) return false;
  if (user.role === UserRole.ADMIN) return true;

  return user.permissions.some((item) => item.permission === permission);
}

export async function requireBackendPermission(
  req: NextApiRequest,
  res: NextApiResponse,
  permission: BackendPermissionKey,
) {
  const user = await getAuthenticatedBackendUser(req);

  if (!user) {
    res.status(401).json({
      error: 'Nicht authentifiziert.',
    });
    return null;
  }

  if (user.role === UserRole.ADMIN) {
    return user;
  }

  const hasPermission = user.permissions.some(
    (item) => item.permission === permission,
  );

  if (!hasPermission) {
    res.status(403).json({
      error: 'Keine Berechtigung.',
    });
    return null;
  }

  return user;
}
