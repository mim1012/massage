import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getAdminStatsData } from '@/lib/server/admin-stats';

test('getAdminStatsData computes period-over-period deltas from DB-side distinct session counts', async () => {
  const originalQueryRaw = prisma.$queryRaw.bind(prisma);
  const originalUserCount = prisma.user.count.bind(prisma.user);
  const originalPageViewCount = prisma.pageViewEvent.count.bind(prisma.pageViewEvent);
  const originalPageViewGroupBy = prisma.pageViewEvent.groupBy.bind(prisma.pageViewEvent);
  const originalShopFindMany = prisma.shop.findMany.bind(prisma.shop);

  const capturedQueries: Prisma.Sql[] = [];

  // Today signups gte-only -> 8; yesterday gte+lt -> 4.
  prisma.user.count = (async (args?: { where?: { createdAt?: { lt?: Date } } }) =>
    args?.where?.createdAt?.lt ? 4 : 8) as unknown as typeof prisma.user.count;

  // Total pageviews (no args) -> 321; this month (gte only) -> 200; last month (gte+lt) -> 100.
  prisma.pageViewEvent.count = (async (args?: { where?: { createdAt?: { lt?: Date } } }) => {
    if (!args?.where) {
      return 321;
    }
    return args.where.createdAt?.lt ? 100 : 200;
  }) as unknown as typeof prisma.pageViewEvent.count;

  // First window query = today/yesterday visitors; second = this month/last month visitors.
  prisma.$queryRaw = (async (query) => {
    capturedQueries.push(query as Prisma.Sql);
    if (capturedQueries.length === 1) {
      return [{ current: 12n, previous: 10n }];
    }
    return [{ current: 90n, previous: 60n }];
  }) as typeof prisma.$queryRaw;

  prisma.pageViewEvent.groupBy = (async (args) => {
    if (Array.isArray(args.by) && args.by.includes('sessionId')) {
      throw new Error('sessionId visitor counts should not use groupBy');
    }

    return [
      { shopId: 'shop-b', _count: { shopId: 20 } },
      { shopId: 'shop-a', _count: { shopId: 10 } },
    ];
  }) as typeof prisma.pageViewEvent.groupBy;

  prisma.shop.findMany = (async () => [
    { id: 'shop-a', name: 'Shop A', regionLabel: '서울' },
    { id: 'shop-b', name: 'Shop B', regionLabel: '부산' },
  ]) as typeof prisma.shop.findMany;

  try {
    const stats = await getAdminStatsData();

    assert.equal(capturedQueries.length, 2);
    for (const query of capturedQueries) {
      const text = query.strings.join('');
      assert.ok(text.includes('COUNT(DISTINCT'));
      assert.ok(text.includes('FROM "page_view_events"'));
      assert.ok(text.includes('FILTER'));
      assert.equal(query.values.length, 4);
      assert.ok(query.values.every((value) => value instanceof Date));
    }

    assert.deepEqual(stats.summary, [
      { label: '오늘 방문자', value: 12, helperText: '전일 대비 +20%', delta: 20 },
      { label: '이번 달 방문자', value: 90, helperText: '전월 대비 +50%', delta: 50 },
      { label: '총 페이지뷰', value: 321, helperText: '전월 대비 +100%', delta: 100 },
      { label: '오늘 회원가입', value: 8, helperText: '전일 대비 +100%', delta: 100 },
    ]);
    assert.deepEqual(stats.topShops, [
      { id: 'shop-b', name: 'Shop B', regionLabel: '부산', viewCount: 20 },
      { id: 'shop-a', name: 'Shop A', regionLabel: '서울', viewCount: 10 },
    ]);
  } finally {
    prisma.$queryRaw = originalQueryRaw;
    prisma.user.count = originalUserCount;
    prisma.pageViewEvent.count = originalPageViewCount;
    prisma.pageViewEvent.groupBy = originalPageViewGroupBy;
    prisma.shop.findMany = originalShopFindMany;
  }
});

test('admin stats backend exposes a cached admin route and matching page-view index', () => {
  const routeSource = readFileSync('src/app/api/admin/stats/route.ts', 'utf8');
  assert.match(routeSource, /requireRole\('ADMIN'\)/);
  assert.match(routeSource, /getCachedAdminStatsData/);

  const providerSource = readFileSync('src/lib/server/admin-stats.ts', 'utf8');
  assert.match(providerSource, /unstable_cache/);
  assert.match(providerSource, /revalidate:\s*60/);

  const schemaSource = readFileSync('prisma/schema.prisma', 'utf8');
  assert.match(schemaSource, /@@index\(\[createdAt\(sort: Desc\), sessionId\]\)/);

  const migrationSource = readFileSync('prisma/migrations/0009_page_view_stats_indexes/migration.sql', 'utf8');
  assert.match(migrationSource, /page_view_events_created_at_session_id_idx/);
  assert.match(migrationSource, /\"created_at\" DESC, \"session_id\"/);
});
