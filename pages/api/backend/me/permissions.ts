// /pages/api/backend/me/permissions.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getAuthenticatedBackendUser,
  getEffectiveBackendPermissionsForUser,
} from '@/lib/backend/permissionGuard';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Methode nicht erlaubt.',
    });
  }

  const user = await getAuthenticatedBackendUser(req);

  if (!user) {
    return res.status(401).json({
      error: 'Nicht authentifiziert.',
    });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    permissions: getEffectiveBackendPermissionsForUser(user),
  });
}
