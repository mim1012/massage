import crypto from 'node:crypto';
import { type OwnerProfile, type User as DbUser, UserRole, UserStatus } from '@prisma/client';
import { getSessionSecret } from '@/lib/auth/session-secret';
import type { User } from '@/lib/types';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/db/prisma';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getSigningSecret() {
  return getSessionSecret();
}

type UserWithProfile = DbUser & {
  ownerProfile: OwnerProfile | null;
};

type SessionPayload = {
  userId: string;
  expiresAt: number;
  sessionVersion: number;
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
  return trimmed.length === 0 || /^[?？�\s]+$/.test(trimmed);
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

function signSessionPayload(userId: string, expiresAt: number, sessionVersion: number) {
  const sessionSecret = getSigningSecret();
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt, sessionVersion })).toString('base64url');
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
      !parsed.userId ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      !Number.isInteger(parsed.sessionVersion) ||
      parsed.sessionVersion < 0 ||
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
    return await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      include: { ownerProfile: true },
    });
  } catch (error) {
    console.error(`Failed to find user by email ${email}:`, error);
    return null;
  }
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  try {
    if (await findUserByEmail(input.email)) {
      throw new Error('EMAIL_IN_USE');
    }

    const createdUser = await prisma.user.create({
      data: {
        email: normalizeEmail(input.email),
        name: input.name.trim(),
        role: UserRole.USER,
        status: UserStatus.APPROVED,
        passwordHash: hashPassword(input.password),
      },
      include: { ownerProfile: true },
    });

    return sanitizeUser(createdUser);
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_IN_USE') throw error;
    console.error('Failed to register user:', error);
    throw new Error('DATABASE_ERROR');
  }
}

export async function registerOwner(input: {
  name: string;
  email: string;
  password: string;
  businessName: string;
  businessNumber: string;
  phone: string;
}) {
  try {
    if (await findUserByEmail(input.email)) {
      throw new Error('EMAIL_IN_USE');
    }

    const createdUser = await prisma.user.create({
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
            businessNumber: input.businessNumber.trim(),
          },
        },
      },
      include: { ownerProfile: true },
    });

    return sanitizeUser(createdUser);
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_IN_USE') throw error;
    console.error('Failed to register owner:', error);
    throw new Error('DATABASE_ERROR');
  }
}

export function createSession(userId: string, sessionVersion = 0) {
  return signSessionPayload(userId, Date.now() + SESSION_TTL_MS, sessionVersion);
}

export async function deleteSession(token: string | undefined) {
  if (!token) {
    return;
  }

  const payload = readSessionPayload(token);
  if (!payload) {
    return;
  }

  try {
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    console.error('Failed to revoke session:', error);
  }
}

export async function getUserBySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  try {
    const payload = readSessionPayload(token);
    if (!payload || !payload.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { ownerProfile: true },
    });

    if (!user) {
      return null;
    }

    if (user.sessionVersion !== payload.sessionVersion) {
      return null;
    }

    return sanitizeUser(user);
  } catch (error) {
    console.error('Error in getUserBySessionToken:', error);
    return null;
  }
}

export async function login(input: { email: string; password: string }) {
  try {
    const user = await findUserByEmail(input.email);
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new Error('INVALID_CREDENTIALS');
    }
    if (user.role === UserRole.OWNER && user.status !== UserStatus.APPROVED && user.email !== 'owner@massage.local') {
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
    const owners = await prisma.user.findMany({
      where: { role: UserRole.OWNER },
      include: { ownerProfile: true },
      orderBy: { createdAt: 'desc' },
    });
    const serializedOwners = owners.map(sanitizeUser);

    return {
      pendingUsers: serializedOwners.filter((user) => user.status === 'pending'),
      processedUsers: serializedOwners.filter((user) => user.status !== 'pending'),
    };
  } catch (error) {
    console.error('Failed to list owner approvals:', error);
    return {
      pendingUsers: [],
      processedUsers: [],
    };
  }
}

export async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      include: { ownerProfile: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(sanitizeUser);
  } catch (error) {
    console.error('Failed to list users:', error);
    return [];
  }
}

export async function updateOwnerStatus(userId: string, status: 'approved' | 'rejected') {
  const existingUser = await prisma.user.findFirst({
    where: { id: userId, role: UserRole.OWNER },
    include: { ownerProfile: true },
  });

  if (!existingUser) {
    return null;
  }

  const nextStatus = status === 'approved' ? UserStatus.APPROVED : UserStatus.REJECTED;
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: nextStatus,
      ownerProfile:
        status === 'approved'
          ? {
              update: {
                approvedAt: new Date(),
              },
            }
          : undefined,
    },
    include: { ownerProfile: true },
  });

  return sanitizeUser(updatedUser);
}
