import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { listManagedReviews, listQna } from '@/lib/server/communityStore';

test('owner managed review search builds OR filters without forcing shop name match', async (t) => {
  const originalFindMany = prisma.review.findMany;
  let capturedArgs: { where: unknown; take?: number; skip?: number } | undefined;

  prisma.review.findMany = (async (args: { where: unknown; take?: number; skip?: number }) => {
    capturedArgs = args;
    return [
      {
        id: 'review-1',
        shopId: 'shop-1',
        authorName: 'Search Author',
        rating: 5,
        content: 'special content token',
        isHidden: false,
        createdAt: new Date('2026-05-16T00:00:00.000Z'),
        shop: {
          name: 'Owned Shop',
          regionLabel: 'Seoul',
        },
      },
    ];
  }) as typeof prisma.review.findMany;

  t.after(() => {
    prisma.review.findMany = originalFindMany;
  });

  const reviews = await listManagedReviews({ id: 'owner-1', role: 'OWNER' }, 'special');

  assert.equal(reviews.length, 1);
  assert.equal(reviews[0]?.content, 'special content token');
  assert.equal(capturedArgs?.take, 100);
  assert.deepEqual(capturedArgs?.where, {
    shop: {
      ownerId: 'owner-1',
    },
    OR: [
      { content: { contains: 'special', mode: Prisma.QueryMode.insensitive } },
      { authorName: { contains: 'special', mode: Prisma.QueryMode.insensitive } },
      { shop: { name: { contains: 'special', mode: Prisma.QueryMode.insensitive } } },
    ],
  });
});

test('managed review pagination is capped and keeps owner scope', async (t) => {
  const originalFindMany = prisma.review.findMany;
  let capturedArgs: { where: unknown; take?: number; skip?: number } | undefined;

  prisma.review.findMany = (async (args: { where: unknown; take?: number; skip?: number }) => {
    capturedArgs = args;
    return [];
  }) as typeof prisma.review.findMany;

  t.after(() => {
    prisma.review.findMany = originalFindMany;
  });

  await listManagedReviews({ id: 'owner-1', role: 'OWNER' }, undefined, { page: 2, pageSize: 500 });

  assert.equal(capturedArgs?.take, 100);
  assert.equal(capturedArgs?.skip, 100);
  assert.deepEqual(capturedArgs?.where, {
    shop: {
      ownerId: 'owner-1',
    },
  });
});

test('managed owner qna reads are owner-scoped and capped', async (t) => {
  const originalFindMany = prisma.qnA.findMany;
  let capturedArgs: { where: unknown; take?: number; skip?: number } | undefined;

  prisma.qnA.findMany = (async (args: { where: unknown; take?: number; skip?: number }) => {
    capturedArgs = args;
    return [
      {
        id: 'qna-1',
        userId: null,
        shopId: 'shop-1',
        question: '문의',
        authorName: '작성자',
        status: 'OPEN',
        createdAt: new Date('2026-05-16T00:00:00.000Z'),
        shop: { ownerId: 'owner-1', name: '업소', regionLabel: '서울' },
        comments: [],
      },
    ];
  }) as typeof prisma.qnA.findMany;

  t.after(() => {
    prisma.qnA.findMany = originalFindMany;
  });

  const qna = await listQna({ shopOwnerId: 'owner-1', viewer: { id: 'owner-1', role: 'OWNER' }, pageSize: 250 });

  assert.equal(qna.length, 1);
  assert.equal(capturedArgs?.take, 100);
  assert.equal(capturedArgs?.skip, 0);
  assert.deepEqual(capturedArgs?.where, {
    shop: {
      ownerId: 'owner-1',
    },
  });
});
