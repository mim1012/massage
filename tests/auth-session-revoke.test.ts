import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { UserRole, UserStatus } from '@prisma/client';
import { getSessionSecret } from '@/lib/auth/session-secret';
import { prisma } from '@/lib/db/prisma';
import { createSession, deleteSession, getUserBySessionToken } from '@/lib/server/auth-store';

const baseUser = {
  id: 'user-session-test',
  email: 'user@example.com',
  passwordHash: 'hash',
  name: 'Session Test User',
  role: UserRole.USER,
  status: UserStatus.APPROVED,
  phone: null,
  managedShopId: null,
  ownerProfile: null,
};

function signToken(payload: Record<string, unknown>) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getSessionSecret()).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

test('current valid token authenticates before revoke', async () => {
  const originalFindUnique = prisma.user.findUnique;
  let findUniqueCalls = 0;
  prisma.user.findUnique = async () => {
    findUniqueCalls += 1;
    return {
      ...baseUser,
      sessionVersion: 0,
    };
  };

  try {
    const authenticatedUser = await getUserBySessionToken(createSession(baseUser.id));

    assert.equal(authenticatedUser?.id, baseUser.id);
    assert.equal(findUniqueCalls, 1);
  } finally {
    prisma.user.findUnique = originalFindUnique;
  }
});

test('deleteSession revokes the active token server-side', async () => {
  const originalFindUnique = prisma.user.findUnique;
  const originalUpdate = prisma.user.update;
  let sessionVersion = 0;
  let updateCalls = 0;
  const token = createSession(baseUser.id);

  prisma.user.findUnique = async ({ where }: { where: { id?: string } }) => {
    if (where.id !== baseUser.id) {
      return null;
    }

    return {
      ...baseUser,
      sessionVersion,
    };
  };
  prisma.user.update = async () => {
    updateCalls += 1;
    sessionVersion += 1;
    return {
      ...baseUser,
      sessionVersion,
    };
  };

  try {
    assert.equal((await getUserBySessionToken(token))?.id, baseUser.id);

    await Reflect.apply(deleteSession as unknown as (...args: unknown[]) => Promise<void>, undefined, [token]);

    assert.equal(await getUserBySessionToken(token), null);
    assert.equal(updateCalls, 1);
  } finally {
    prisma.user.findUnique = originalFindUnique;
    prisma.user.update = originalUpdate;
  }
});

test('malformed or stale session version tokens reject safely', async () => {
  const originalFindUnique = prisma.user.findUnique;
  prisma.user.findUnique = async ({ where }: { where: { id?: string } }) => {
    if (where.id !== baseUser.id) {
      return null;
    }

    return {
      ...baseUser,
      sessionVersion: 0,
    };
  };

  try {
    const expiresAt = Date.now() + 60_000;
    const malformedVersionToken = signToken({
      userId: baseUser.id,
      expiresAt,
      sessionVersion: 'not-a-number',
    });
    const staleVersionToken = signToken({
      userId: baseUser.id,
      expiresAt,
      sessionVersion: 999,
    });

    assert.equal(await getUserBySessionToken(malformedVersionToken), null);
    assert.equal(await getUserBySessionToken(staleVersionToken), null);
  } finally {
    prisma.user.findUnique = originalFindUnique;
  }
});
