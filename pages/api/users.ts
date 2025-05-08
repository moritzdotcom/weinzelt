import { getServerSession, hashPassword } from '@/lib/session';
import prisma from '@/lib/prismadb';
import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json('Not authenticated');

  if (req.method === 'GET') {
    await handleGET(req, res);
  } else if (req.method === 'PUT') {
    await handlePUT(req, res, session.id);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetUsersResponse = {
  id: string;
  name: string;
  email: string;
}[];

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });

  return res.json(users);
}

async function handlePUT(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) {
  const { name, email, password, newPassword } = req.body;
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return res.status(404).json('User Not Found');

  if (password && newPassword && user.password !== hashPassword(password))
    return res.status(401).json('Invalid Password');

  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || undefined,
        email: email || undefined,
        password: newPassword ? hashPassword(newPassword) : undefined,
      },
    });
    return res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code == 'P2002')
        return res.status(500).json('Email bereits vergeben');
      return res.status(500).json(error.message);
    } else {
      res.status(500).json('Unbekannter Fehler');
    }
  }
}
