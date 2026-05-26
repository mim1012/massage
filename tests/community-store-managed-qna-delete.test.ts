import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/db/prisma';
import { deleteManagedQna } from '@/lib/server/communityStore';

test('admin can delete any qna entry including general inquiries', async (t) => {
  const originalFindUnique = prisma.qnA.findUnique;
  const originalDelete = prisma.qnA.delete;
  const deletedIds: string[] = [];

  prisma.qnA.findUnique = (async () => ({
    id: 'qna-general',
    shop: null,
  })) as typeof prisma.qnA.findUnique;

  prisma.qnA.delete = (async (args: { where: { id: string } }) => {
    deletedIds.push(args.where.id);
    return { id: args.where.id };
  }) as typeof prisma.qnA.delete;

  t.after(() => {
    prisma.qnA.findUnique = originalFindUnique;
    prisma.qnA.delete = originalDelete;
  });

  assert.equal(await deleteManagedQna({ id: 'admin-1', role: 'ADMIN' }, 'qna-general'), true);
  assert.deepEqual(deletedIds, ['qna-general']);
});

test('owner can delete qna for their own shop but not unrelated or ownerless entries', async (t) => {
  const originalFindUnique = prisma.qnA.findUnique;
  const originalDelete = prisma.qnA.delete;
  const deletedIds: string[] = [];

  prisma.qnA.findUnique = (async (args: { where: { id: string } }) => {
    if (args.where.id === 'owned-qna') {
      return {
        id: 'owned-qna',
        shop: { ownerId: 'owner-1' },
      };
    }

    if (args.where.id === 'other-qna') {
      return {
        id: 'other-qna',
        shop: { ownerId: 'owner-2' },
      };
    }

    if (args.where.id === 'general-qna') {
      return {
        id: 'general-qna',
        shop: null,
      };
    }

    return null;
  }) as typeof prisma.qnA.findUnique;

  prisma.qnA.delete = (async (args: { where: { id: string } }) => {
    deletedIds.push(args.where.id);
    return { id: args.where.id };
  }) as typeof prisma.qnA.delete;

  t.after(() => {
    prisma.qnA.findUnique = originalFindUnique;
    prisma.qnA.delete = originalDelete;
  });

  assert.equal(await deleteManagedQna({ id: 'owner-1', role: 'OWNER' }, 'owned-qna'), true);
  assert.equal(await deleteManagedQna({ id: 'owner-1', role: 'OWNER' }, 'other-qna'), false);
  assert.equal(await deleteManagedQna({ id: 'owner-1', role: 'OWNER' }, 'general-qna'), false);
  assert.equal(await deleteManagedQna({ id: 'owner-1', role: 'OWNER' }, 'missing-qna'), false);
  assert.deepEqual(deletedIds, ['owned-qna']);
});

test('deleteManagedQna rethrows unexpected persistence failures instead of masking them as 404-style misses', async (t) => {
  const originalFindUnique = prisma.qnA.findUnique;
  const originalDelete = prisma.qnA.delete;

  prisma.qnA.findUnique = (async () => ({
    id: 'qna-broken',
    shop: { ownerId: 'owner-1' },
  })) as typeof prisma.qnA.findUnique;

  prisma.qnA.delete = (async () => {
    throw new Error('database offline');
  }) as typeof prisma.qnA.delete;

  t.after(() => {
    prisma.qnA.findUnique = originalFindUnique;
    prisma.qnA.delete = originalDelete;
  });

  await assert.rejects(
    deleteManagedQna({ id: 'owner-1', role: 'OWNER' }, 'qna-broken'),
    /database offline/,
  );
});
