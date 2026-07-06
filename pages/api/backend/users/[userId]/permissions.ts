// /pages/api/backend/users/[userId]/permissions.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prismadb';
import {
  BACKEND_PERMISSIONS,
  sanitizeBackendPermissions,
} from '@/lib/backend/permissions';
import { requireBackendPermission } from '@/lib/backend/permissionGuard';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const authUser = await requireBackendPermission(
    req,
    res,
    BACKEND_PERMISSIONS.USERS,
  );

  if (!authUser) return;

  const { userId } = req.query;

  if (typeof userId !== 'string') {
    return res.status(400).json({
      error: 'User fehlt.',
    });
  }

  if (req.method === 'GET') {
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
          orderBy: {
            permission: 'asc',
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Benutzer nicht gefunden.',
      });
    }

    return res.status(200).json({
      user: {
        ...user,
        permissions: user.permissions.map((item) => item.permission),
      },
    });
  }

  if (req.method === 'PUT') {
    const permissions = sanitizeBackendPermissions(req.body.permissions);

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Benutzer nicht gefunden.',
      });
    }

    const user = await prisma.$transaction(async (tx) => {
      await tx.userPermission.deleteMany({
        where: {
          userId,
        },
      });

      if (permissions.length > 0) {
        await tx.userPermission.createMany({
          data: permissions.map((permission) => ({
            userId,
            permission,
          })),
          skipDuplicates: true,
        });
      }

      return tx.user.findUnique({
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
            orderBy: {
              permission: 'asc',
            },
          },
        },
      });
    });

    return res.status(200).json({
      user: user
        ? {
            ...user,
            permissions: user.permissions.map((item) => item.permission),
          }
        : null,
    });
  }

  return res.status(405).json({
    error: 'Methode nicht erlaubt.',
  });
}
