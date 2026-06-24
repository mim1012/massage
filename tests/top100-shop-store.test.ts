import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { listDirectoryShops, listTopShops, type ShopListRecord } from '@/lib/server/shop-store';

function makeShopListRecord(partial: Partial<ShopListRecord> & Pick<ShopListRecord, 'id' | 'slug' | 'name'>): ShopListRecord {
  return {
    id: partial.id,
    name: partial.name,
    slug: partial.slug,
    region: partial.region ?? 'seoul',
    regionLabel: partial.regionLabel ?? '서울',
    subRegion: partial.subRegion ?? 'gangnam',
    subRegionLabel: partial.subRegionLabel ?? '강남',
    theme: partial.theme ?? 'swedish',
    themeLabel: partial.themeLabel ?? '스웨디시',
    isPremium: partial.isPremium ?? false,
    premiumOrder: partial.premiumOrder ?? null,
    thumbnailUrl: partial.thumbnailUrl ?? '/thumb.jpg',
    bannerUrl: partial.bannerUrl ?? '/banner.jpg',
    tagline: partial.tagline ?? 'tagline',
    rating: partial.rating ?? 4.5,
    reviewCount: partial.reviewCount ?? 1,
    tags: partial.tags ?? ['힐링'],
    createdAt: partial.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: partial.updatedAt ?? new Date('2026-01-01T00:00:00.000Z'),
    images: partial.images ?? [{ imageUrl: '/gallery.jpg' }],
    courses: partial.courses ?? [{ price: 100000 }],
  };
}

test('listTopShops uses a limited ranking query and preserves ranked ids when hydrating cards', async () => {
  const originalQueryRaw = prisma.$queryRaw.bind(prisma);
  const originalFindMany = prisma.shop.findMany.bind(prisma.shop);
  const uniqueQuery = `힐링-${Date.now()}`;
  let capturedSql: Prisma.Sql | null = null;
  let capturedFindManyArgs: Parameters<typeof prisma.shop.findMany>[0] | undefined;

  prisma.$queryRaw = (async (query) => {
    capturedSql = query as Prisma.Sql;
    return [{ id: 'shop-b' }, { id: 'shop-a' }];
  }) as typeof prisma.$queryRaw;

  prisma.shop.findMany = (async (args) => {
    capturedFindManyArgs = args;
    return [
      makeShopListRecord({ id: 'shop-a', slug: 'shop-a', name: 'Shop A', rating: 4.1, reviewCount: 3 }),
      makeShopListRecord({ id: 'shop-b', slug: 'shop-b', name: 'Shop B', rating: 4.9, reviewCount: 5 }),
    ];
  }) as typeof prisma.shop.findMany;

  try {
    const ranked = await listTopShops({ region: 'busan', query: uniqueQuery }, 2);

    assert.ok(capturedSql, 'expected listTopShops to issue a ranking query');
    assert.ok(capturedSql.strings.join('').includes('LIMIT '));
    assert.ok(capturedSql.strings.join('').includes('s."review_count" DESC'));
    assert.ok(capturedSql.strings.join('').includes('s."region" IN ('));
    assert.equal(capturedSql.values[0], 'busan');
    assert.equal(capturedSql.values[1], 'gyeongsang');
    assert.equal(capturedSql.values.at(-1), 2);
    assert.equal(capturedSql.values.filter((value) => value === `%${uniqueQuery}%`).length, 1);
    assert.equal(capturedSql.values.includes(uniqueQuery), false);

    assert.deepEqual(capturedFindManyArgs?.where, {
      id: { in: ['shop-b', 'shop-a'] },
    });
    assert.deepEqual(ranked.map((shop) => shop.id), ['shop-b', 'shop-a']);
    assert.deepEqual(ranked.map((shop) => shop.reviewCount), [5, 3]);
  } finally {
    prisma.$queryRaw = originalQueryRaw;
    prisma.shop.findMany = originalFindMany;
  }
});
test('popular directory regular rows use db ordering and pagination', async () => {
  const originalFindMany = prisma.shop.findMany.bind(prisma.shop);
  const originalCount = prisma.shop.count.bind(prisma.shop);
  const capturedFindManyArgs: Array<Parameters<typeof prisma.shop.findMany>[0]> = [];

  prisma.shop.findMany = (async (args) => {
    capturedFindManyArgs.push(args);
    return [];
  }) as typeof prisma.shop.findMany;

  prisma.shop.count = (async () => 12) as typeof prisma.shop.count;

  try {
    const result = await listDirectoryShops({
      sort: 'popular',
      regularOffset: 20,
      regularLimit: 10,
      query: `source-guard-${Date.now()}`,
    });

    const regularQuery = capturedFindManyArgs.find((args) => args?.where && 'isPremium' in args.where && args.where.isPremium === false);

    assert.ok(regularQuery, 'expected a regular shop query');
    assert.deepEqual(regularQuery.orderBy, [{ reviewCount: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }]);
    assert.equal(regularQuery.skip, 20);
    assert.equal(regularQuery.take, 10);
    assert.deepEqual(result.regularShops, []);
    assert.equal(result.regularTotal, 12);
  } finally {
    prisma.shop.findMany = originalFindMany;
    prisma.shop.count = originalCount;
  }
});
