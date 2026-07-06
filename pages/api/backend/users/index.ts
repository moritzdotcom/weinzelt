// /pages/api/backend/users/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import prisma from '@/lib/prismadb';
import { BACKEND_PERMISSIONS } from '@/lib/backend/permissions';
import { requireBackendPermission } from '@/lib/backend/permissionGuard';
import { sanitizeBackendPermissions } from '@/lib/backend/permissions';
import sendBackendUserInviteMail from '@/lib/mailer/sendBackendUserInviteMail';
import { hashPassword } from '@/lib/session';

function generateTemporaryPassword() {
  return randomBytes(12)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 16);
}

function normalizeEmail(email: unknown) {
  if (typeof email !== 'string') return null;

  const normalized = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

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

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({
      orderBy: {
        name: 'asc',
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

    return res.status(200).json({
      users: users.map((user) => ({
        ...user,
        permissions: user.permissions.map((item) => item.permission),
      })),
    });
  }

  if (req.method === 'POST') {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

    const email = normalizeEmail(req.body.email);

    if (!name) {
      return res.status(400).json({
        error: 'Name fehlt.',
      });
    }

    if (!email) {
      return res.status(400).json({
        error: 'Ungültige E-Mail-Adresse.',
      });
    }

    const providedPassword =
      typeof req.body.password === 'string' && req.body.password.trim()
        ? req.body.password.trim()
        : null;

    if (providedPassword && providedPassword.length < 8) {
      return res.status(400).json({
        error: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
      });
    }

    const generatedPassword = !providedPassword;
    const temporaryPassword = providedPassword || generateTemporaryPassword();

    const passwordHash = hashPassword(temporaryPassword);

    const permissions = sanitizeBackendPermissions(req.body.permissions);

    const requestedRole = req.body.role;

    const role =
      requestedRole === UserRole.ADMIN && authUser.role === UserRole.ADMIN
        ? UserRole.ADMIN
        : UserRole.USER;

    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role,
          permissions: {
            create: permissions.map((permission) => ({
              permission,
            })),
          },
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

      let inviteMailSent = false;
      let inviteMailError: string | null = null;

      if (req.body.sendInvite === true) {
        try {
          await sendBackendUserInviteMail({
            email,
            name,
            temporaryPassword,
          });

          inviteMailSent = true;
        } catch (error) {
          console.error('[backend-users] invite mail failed:', error);
          inviteMailError =
            'Benutzer wurde erstellt, aber die Einladung konnte nicht versendet werden.';
        }
      }

      return res.status(201).json({
        user: {
          ...user,
          permissions: user.permissions.map((item) => item.permission),
        },
        inviteMailSent,
        inviteMailError,
        temporaryPassword:
          generatedPassword && !inviteMailSent ? temporaryPassword : undefined,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return res.status(409).json({
          error: 'Diese E-Mail-Adresse existiert bereits.',
        });
      }

      console.error('[backend-users] create user failed:', error);

      return res.status(500).json({
        error: 'Benutzer konnte nicht erstellt werden.',
      });
    }
  }

  return res.status(405).json({
    error: 'Methode nicht erlaubt.',
  });
}
