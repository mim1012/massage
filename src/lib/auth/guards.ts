import { type UserRole } from '@/lib/types';
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
