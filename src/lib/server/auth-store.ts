import crypto from 'node:crypto';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { getSessionSecret } from '@/lib/auth/session-secret';
import type { User } from '@/lib/types';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/db/prisma';
import { withDatabaseRetry } from '@/lib/db/retry';
import { getSharedInFlight } from '@/lib/server/in-flight';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getSigningSecret() {
  return getSessionSecret();
}

const authUserSelect = {
  id: true,
  email: true,
  passwordHash: true,
  sessionVersion: true,
  name: true,
  role: true,
  status: true,
  phone: true,
  managedShopId: true,
  ownerProfile: true,
} satisfies Prisma.UserSelect;

type UserWithProfile = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;

type SessionPayload = {
  userId: string;
  expiresAt: number;
  sessionVersion: number;
};

const sessionUserInFlight = new Map<string, Promise<User | null>>();

type UserListFilters = {
  page?: number;
  pageSize?: number;
  query?: string;
  role?: UserRole;
  status?: UserStatus;
};

export type UserListResult = {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function normalizeEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (trimmed && !trimmed.includes('@')) {
    return `${trimmed}@massage.local`;
  }
  return trimmed;
}

function mapStatus(status: UserStatus): NonNullable<User['status']> {
  switch (status) {
    case UserStatus.PENDING:
      return 'pending';
    case UserStatus.REJECTED:
      return 'rejected';
    case UserStatus.APPROVED:
    default:
      return 'approved';
  }
}

function isBrokenDisplayName(name: string) {
  const trimmed = name.trim();
  return trimmed.length === 0 || /^[?？\s]+$/.test(trimmed);
}

function getFallbackDisplayName(user: UserWithProfile) {
  if (user.role === UserRole.ADMIN) {
    return '관리자';
  }

  if (user.role === UserRole.OWNER) {
    return user.ownerProfile?.businessName?.trim() || '업체 관리자';
  }

  return '회원';
}

function sanitizeUser(user: UserWithProfile): User {
  return {
    id: user.id,
    email: user.email,
    name: isBrokenDisplayName(user.name) ? getFallbackDisplayName(user) : user.name,
    role: user.role,
    managedShopId: user.managedShopId ?? undefined,
    status: mapStatus(user.status),
    businessName: user.ownerProfile?.businessName,
    businessNumber: user.ownerProfile?.businessNumber,
    phone: user.phone ?? undefined,
  };
}

function signSessionPayload(userId: string, sessionVersion: number, expiresAt: number) {
  const sessionSecret = getSigningSecret();
  const payload = Buffer.from(JSON.stringify({ userId, sessionVersion, expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readSessionPayload(token: string) {
  const sessionSecret = getSigningSecret();
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  if (signature.length !== expectedSignature.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

    if (
      !parsed ||
      !parsed.userId ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.sessionVersion !== 'number' ||
      typeof parsed.expiresAt !== 'number' ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }

    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

export async function findUserByEmail(email: string) {
  try {
    return await withDatabaseRetry(
      () =>
        prisma.user.findUnique({
          where: { email: normalizeEmail(email) },
          select: authUserSelect,
        }),
      3,
      'find user by email',
    );
  } catch (error) {
    console.error(`Failed to find user by email ${email}:`, error);
    throw new Error('DATABASE_ERROR');
  }
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  try {
    if (await findUserByEmail(input.email)) {
      throw new Error('EMAIL_IN_USE');
    }

    const createdUser = await withDatabaseRetry(
      () =>
        prisma.user.create({
          data: {
            email: normalizeEmail(input.email),
            name: input.name.trim(),
            role: UserRole.USER,
            status: UserStatus.APPROVED,
            passwordHash: hashPassword(input.password),
          },
          include: { ownerProfile: true },
        }),
      3,
      'register user',
    );

    return sanitizeUser(createdUser);
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_IN_USE') throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new Error('EMAIL_IN_USE');
    console.error('Failed to register user:', error);
    throw new Error('DATABASE_ERROR');
  }
}

export async function registerOwner(input: {
  name: string;
  email: string;
  password: string;
  businessName: string;
  businessNumber?: string;
  phone: string;
}) {
try {
    const existingUser = await findUserByEmail(input.email);
    if (existingUser && (existingUser.role !== UserRole.OWNER || existingUser.status !== UserStatus.REJECTED)) {
      throw new Error('EMAIL_IN_USE');
    }

    if (existingUser?.role === UserRole.OWNER && existingUser.status === UserStatus.REJECTED) {
      const reopenedUser = await withDatabaseRetry(
        () =>
          prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: input.name.trim(),
              status: UserStatus.PENDING,
              phone: input.phone.trim(),
              passwordHash: hashPassword(input.password),
              sessionVersion: {
                increment: 1,
              },
              ownerProfile: {
                upsert: {
                  create: {
                    businessName: input.businessName.trim(),
                    businessNumber: (input.businessNumber ?? '').trim(),
                  },
                  update: {
                    businessName: input.businessName.trim(),
                    businessNumber: (input.businessNumber ?? '').trim(),
                    approvedAt: null,
                    approvedBy: null,
                  },
                },
              },
            },
            include: { ownerProfile: true },
          }),
        3,
        'reopen owner registration',
      );

      return sanitizeUser(reopenedUser);
    }

    const createdUser = await withDatabaseRetry(
      () =>
        prisma.user.create({
          data: {
            email: normalizeEmail(input.email),
            name: input.name.trim(),
            role: UserRole.OWNER,
            status: UserStatus.PENDING,
            phone: input.phone.trim(),
            passwordHash: hashPassword(input.password),
            ownerProfile: {
              create: {
                businessName: input.businessName.trim(),
                businessNumber: (input.businessNumber ?? '').trim(),
              },
            },
          },
          include: { ownerProfile: true },
        }),
      3,
      'register owner',
    );

    return sanitizeUser(createdUser);
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_IN_USE') throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new Error('EMAIL_IN_USE');
    console.error('Failed to register owner:', error);
    throw new Error('DATABASE_ERROR');
  }
}

export function createSession(userId: string, sessionVersion: number) {
  return signSessionPayload(userId, sessionVersion, Date.now() + SESSION_TTL_MS);
}

export async function deleteSession(token: string | undefined) {
  if (!token) {
    return;
  }

  const payload = readSessionPayload(token);
  if (!payload) {
    return;
  }
  sessionUserInFlight.delete(token);

  try {
    await withDatabaseRetry(() =>
      prisma.user.update({
        where: { id: payload.userId },
        data: {
          sessionVersion: {
            increment: 1,
          },
        },
      }),
    );
  } catch (error) {
    console.error('Failed to revoke session:', error);
    throw new Error('DATABASE_ERROR');
  }
}

export async function getUserBySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const payload = readSessionPayload(token);
  if (!payload || !payload.userId) {
    return null;
  }

  return getSharedInFlight(sessionUserInFlight, token, async () => {
    try {
      const user = await withDatabaseRetry(() =>
        prisma.user.findUnique({
          where: { id: payload.userId },
          select: authUserSelect,
        }),
      );

      if (!user) {
        return null;
      }

      if (user.sessionVersion !== payload.sessionVersion) {
        return null;
      }

      if (user.role === UserRole.OWNER && user.status !== UserStatus.APPROVED) {
        return null;
      }

      return sanitizeUser(user);
    } catch (error) {
      console.error('Error in getUserBySessionToken:', error);
      throw new Error('DATABASE_ERROR');
    }
  });
}

export async function login(input: { email: string; password: string }) {
  try {
    const user = await findUserByEmail(input.email);
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new Error('INVALID_CREDENTIALS');
    }
    if (user.role === UserRole.OWNER && user.status !== UserStatus.APPROVED) {
      throw new Error('OWNER_NOT_APPROVED');
    }

    return {
      user: sanitizeUser(user),
      token: createSession(user.id, user.sessionVersion),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (['INVALID_CREDENTIALS', 'OWNER_NOT_APPROVED'].includes(msg)) throw error;
    console.error('Login error:', error);
    throw new Error('DATABASE_ERROR');
  }
}

export async function listOwnerApprovals() {
  try {
    const owners = await withDatabaseRetry(() =>
      prisma.user.findMany({
        where: { role: UserRole.OWNER },
        include: { ownerProfile: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
    const serializedOwners = owners.map(sanitizeUser);

    return {
      pendingUsers: serializedOwners.filter((user) => user.status === 'pending'),
      processedUsers: serializedOwners.filter((user) => user.status !== 'pending'),
    };
  } catch (error) {
    console.error('Failed to list owner approvals:', error);
    throw new Error('DATABASE_ERROR');
  }
}

function buildUserListWhere(filters: UserListFilters): Prisma.UserWhereInput {
  const query = filters.query?.trim();

  return {
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(query
      ? {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { ownerProfile: { is: { businessName: { contains: query, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };
}

export async function listUsers() {
  try {
    const users = await withDatabaseRetry(() =>
      prisma.user.findMany({
        include: { ownerProfile: true },
        orderBy: { createdAt: 'desc' },
      }),
    );

    return users.map(sanitizeUser);
  } catch (error) {
    console.error('Failed to list users:', error);
    throw new Error('DATABASE_ERROR');
  }
}

export async function listUsersPage(filters: UserListFilters = {}): Promise<UserListResult> {
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const pageSize = Math.min(100, Math.max(10, Math.floor(filters.pageSize ?? 20)));
  const where = buildUserListWhere(filters);

  try {
    const [users, total] = await withDatabaseRetry(() =>
      Promise.all([
        prisma.user.findMany({
          where,
          include: { ownerProfile: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.user.count({ where }),
      ]),
    );

    return {
      users: users.map(sanitizeUser),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error) {
    console.error('Failed to list users page:', error);
    throw new Error('DATABASE_ERROR');
  }
}

export async function updateManagedUser(
  userId: string,
  input: {
    name?: string;
    phone?: string | null;
    status?: NonNullable<User['status']>;
  },
) {
  const data: Prisma.UserUpdateInput = {};
  const trimmedName = input.name?.trim();
  const trimmedPhone = input.phone?.trim();
  if (input.name !== undefined && !trimmedName) {
    throw new Error('USER_NAME_REQUIRED');
  }

  if (trimmedName) {
    data.name = trimmedName;
  }

  if (input.phone !== undefined) {
    data.phone = trimmedPhone || null;
  }

  if (input.status) {
    data.status =
      input.status === 'pending'
        ? UserStatus.PENDING
        : input.status === 'rejected'
          ? UserStatus.REJECTED
          : UserStatus.APPROVED;
    data.sessionVersion = { increment: 1 };
  }

  if (Object.keys(data).length === 0) {
    return null;
  }

  try {
    return await withDatabaseRetry(() =>
      prisma.$transaction(async (tx) => {
        const targetUser = await tx.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (!targetUser) {
          return null;
        }

        if (input.status && targetUser.role !== UserRole.OWNER) {
          throw new Error('USER_STATUS_NOT_MANAGED');
        }

        await tx.user.update({
          where: { id: userId },
          data,
        });

        if (input.status && targetUser.role === UserRole.OWNER) {
          await tx.ownerProfile.updateMany({
            where: { userId },
            data:
              input.status === 'approved'
                ? { approvedAt: new Date() }
                : { approvedAt: null, approvedBy: null },
          });
        }

        const updatedUser = await tx.user.findUnique({
          where: { id: userId },
          include: { ownerProfile: true },
        });

        return updatedUser ? sanitizeUser(updatedUser) : null;
      }),
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_STATUS_NOT_MANAGED') {
      throw error;
    }

    console.error('Failed to update managed user:', error);
    throw new Error('DATABASE_ERROR');
  }
}

export async function updateOwnerStatus(userId: string, status: 'approved' | 'rejected') {
  const nextStatus = status === 'approved' ? UserStatus.APPROVED : UserStatus.REJECTED;
  const db = prisma;

  try {
    return await withDatabaseRetry(
      async () => {
        const transition = await db.user.updateMany({
          where: {
            id: userId,
            role: UserRole.OWNER,
            status: UserStatus.PENDING,
          },
          data: {
            status: nextStatus,
            sessionVersion: {
              increment: 1,
            },
          },
        });

        if (transition.count === 0) {
          const alreadyTransitionedUser = await db.user.findFirst({
            where: { id: userId, role: UserRole.OWNER, status: nextStatus },
            select: authUserSelect,
          });

          return alreadyTransitionedUser ? sanitizeUser(alreadyTransitionedUser) : null;
        }

        if (status === 'approved') {
          await db.ownerProfile.updateMany({
            where: { userId },
            data: { approvedAt: new Date() },
          });
        }

        const updatedUser = await db.user.findFirst({
          where: { id: userId, role: UserRole.OWNER, status: nextStatus },
          select: authUserSelect,
        });

        return updatedUser ? sanitizeUser(updatedUser) : null;
      },
      5,
      `update owner ${status} status`,
    );
  } catch (error) {
    console.error('Failed to update owner approval status:', error);
    throw new Error('DATABASE_ERROR');
  }
}
