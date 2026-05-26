import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { listManagedReviews } from '@/lib/server/communityStore';

test('owner managed review search builds OR filters without forcing shop name match', async (t) => {
  const originalFindMany = prisma.review.findMany;
  let capturedWhere: unknown;

  prisma.review.findMany = (async (args: { where: unknown }) => {
    capturedWhere = args.where;
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
  assert.deepEqual(capturedWhere, {
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
