import { type User, type UserRole } from '@/lib/types';
import { getSessionCookie } from '@/lib/auth/session';
import { getUserBySessionToken } from '@/lib/server/auth-store';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function getSessionUser() {
  const token = await getSessionCookie();
  return await getUserBySessionToken(token);
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError('Authentication required.', 401);
  }

  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError('Forbidden.', 403);
  }

  return user;
}

export function assertOwnershipOrAdmin(
  user: Pick<User, 'id' | 'role'>,
  resourceOwnerId: string | null | undefined,
) {
  if (user.role === 'ADMIN') {
    return;
  }

  if (user.role !== 'OWNER' || !resourceOwnerId || resourceOwnerId !== user.id) {
    throw new AuthError('Forbidden.', 403);
  }
}
