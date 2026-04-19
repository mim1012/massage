import crypto from 'node:crypto';
import { type OwnerProfile, type User as DbUser, UserRole, UserStatus } from '@prisma/client';
import { getSessionSecret } from '@/lib/auth/session-secret';
import type { User } from '@/lib/types';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/db/prisma';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const SESSION_SECRET = getSessionSecret();

type UserWithProfile = DbUser & {
  ownerProfile: OwnerProfile | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

function sanitizeUser(user: UserWithProfile): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    managedShopId: user.managedShopId ?? undefined,
    status: mapStatus(user.status),
    businessName: user.ownerProfile?.businessName,
    businessNumber: user.ownerProfile?.businessNumber,
    phone: user.phone ?? undefined,
  };
}

function signSessionPayload(userId: string, expiresAt: number) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readSessionPayload(token: string) {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (signature.length !== expectedSignature.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      userId?: string;
      expiresAt?: number;
    };

    if (!parsed.userId || typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    include: { ownerProfile: true },
  });
}

export async function registerUser(input: { name: string; email: string; password: string }) {
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
}

export async function registerOwner(input: {
  name: string;
  email: string;
  password: string;
  businessName: string;
  businessNumber: string;
  phone: string;
}) {
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
}

export function createSession(userId: string) {
  return signSessionPayload(userId, Date.now() + SESSION_TTL_MS);
}

export async function deleteSession() {
  return;
}

export async function getUserBySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const payload = readSessionPayload(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { ownerProfile: true },
  });

  return user ? sanitizeUser(user) : null;
}

export async function login(input: { email: string; password: string }) {
  const user = await findUserByEmail(input.email);
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error('INVALID_CREDENTIALS');
  }
  if (user.role === UserRole.OWNER && user.status !== UserStatus.APPROVED) {
    throw new Error('OWNER_NOT_APPROVED');
  }

  return {
    user: sanitizeUser(user),
    token: createSession(user.id),
  };
}

export async function listOwnerApprovals() {
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
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    include: { ownerProfile: true },
    orderBy: { createdAt: 'desc' },
  });

  return users.map(sanitizeUser);
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
