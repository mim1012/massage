import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { listPublicQnaPage, listPublicReviewPage } from '@/lib/server/communityStore';

test('listPublicReviewPage applies server-side pagination and returns paging metadata', async (t) => {
  const originalCount = prisma.review.count;
  const originalFindMany = prisma.review.findMany;
  let capturedCountArgs: Parameters<typeof prisma.review.count>[0] | undefined;
  let capturedFindManyArgs: Parameters<typeof prisma.review.findMany>[0] | undefined;

  prisma.review.count = (async (args) => {
    capturedCountArgs = args;
    return 42;
  }) as typeof prisma.review.count;

  prisma.review.findMany = (async (args) => {
    capturedFindManyArgs = args;
    return [
      {
        id: 'review-21',
        shopId: 'shop-1',
        userId: 'user-1',
        authorName: 'Reviewer',
        rating: 5,
        content: 'token review body',
        isHidden: false,
        createdAt: new Date('2026-05-17T00:00:00.000Z'),
        updatedAt: new Date('2026-05-17T00:00:00.000Z'),
        shop: { name: 'Shop One' },
      },
    ];
  }) as typeof prisma.review.findMany;

  t.after(() => {
    prisma.review.count = originalCount;
    prisma.review.findMany = originalFindMany;
  });

  const result = await listPublicReviewPage({ page: 3, pageSize: 10, shopId: ' shop-1 ', search: ' token ' });

  assert.deepEqual(capturedCountArgs, {
    where: {
      isHidden: false,
      shopId: 'shop-1',
      OR: [
        { content: { contains: 'token', mode: Prisma.QueryMode.insensitive } },
        { authorName: { contains: 'token', mode: Prisma.QueryMode.insensitive } },
        { shop: { name: { contains: 'token', mode: Prisma.QueryMode.insensitive } } },
      ],
    },
  });

  assert.deepEqual(capturedFindManyArgs, {
    where: capturedCountArgs?.where,
    include: { shop: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    skip: 20,
    take: 10,
  });

  assert.deepEqual(result, {
    items: [
      {
        id: 'review-21',
        shopId: 'shop-1',
        shopName: 'Shop One',
        authorName: 'Reviewer',
        rating: 5,
        content: 'token review body',
        isHidden: false,
        createdAt: '2026-05-17T00:00:00.000Z',
      },
    ],
    page: 3,
    pageSize: 10,
    totalItems: 42,
    totalPages: 5,
  });
});

test('listPublicQnaPage applies server-side pagination and returns paging metadata', async (t) => {
  const originalCount = prisma.qnA.count;
  const originalFindMany = prisma.qnA.findMany;
  let capturedCountArgs: Parameters<typeof prisma.qnA.count>[0] | undefined;
  let capturedFindManyArgs: Parameters<typeof prisma.qnA.findMany>[0] | undefined;

  prisma.qnA.count = (async (args) => {
    capturedCountArgs = args;
    return 12;
  }) as typeof prisma.qnA.count;

  prisma.qnA.findMany = (async (args) => {
    capturedFindManyArgs = args;
    return [
      {
        id: 'qna-11',
        shopId: 'shop-9',
        question: 'token question',
        authorName: 'Asker',
        status: 'OPEN',
        createdAt: new Date('2026-05-17T01:00:00.000Z'),
        updatedAt: new Date('2026-05-17T01:00:00.000Z'),
        shop: {
          ownerId: 'owner-1',
          name: 'Shop Nine',
          regionLabel: 'Seoul',
        },
        comments: [],
      },
    ];
  }) as typeof prisma.qnA.findMany;

  t.after(() => {
    prisma.qnA.count = originalCount;
    prisma.qnA.findMany = originalFindMany;
  });

  const result = await listPublicQnaPage({ page: 2, pageSize: 5, shopId: ' shop-9 ', search: ' token ' });

  assert.deepEqual(capturedCountArgs, {
    where: {
      shopId: 'shop-9',
      OR: [
        { question: { contains: 'token', mode: Prisma.QueryMode.insensitive } },
        { authorName: { contains: 'token', mode: Prisma.QueryMode.insensitive } },
        { comments: { some: { content: { contains: 'token', mode: Prisma.QueryMode.insensitive } } } },
      ],
    },
  });

  assert.deepEqual(capturedFindManyArgs, {
    where: capturedCountArgs?.where,
    include: {
      shop: {
        select: {
          ownerId: true,
          name: true,
          regionLabel: true,
        },
      },
      comments: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: 5,
    take: 5,
  });

  assert.deepEqual(result, {
    items: [
      {
        id: 'qna-11',
        shopId: 'shop-9',
        shopName: 'Shop Nine',
        shopRegionLabel: 'Seoul',
        question: 'token question',
        answer: undefined,
        authorName: 'Asker',
        isAnswered: false,
        canComment: false,
        commentCount: 0,
        latestCommentAt: undefined,
        latestCommentPreview: undefined,
        comments: [],
        createdAt: '2026-05-17T01:00:00.000Z',
      },
    ],
    page: 2,
    pageSize: 5,
    totalItems: 12,
    totalPages: 3,
  });
});
