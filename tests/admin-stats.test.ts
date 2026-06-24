import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getAdminStatsData } from '@/lib/server/admin-stats';

test('getAdminStatsData computes stats with two optimized aggregate queries', async () => {
  const originalQueryRaw = prisma.$queryRaw.bind(prisma);
  const capturedQueries: Prisma.Sql[] = [];

  prisma.$queryRaw = (async (query) => {
    capturedQueries.push(query as Prisma.Sql);

    if (capturedQueries.length === 1) {
      return [
        {
          today_visitors: 12n,
          yesterday_visitors: 10n,
          month_visitors: 90n,
          last_month_visitors: 60n,
          total_page_views: 321n,
          this_month_page_views: 200n,
          last_month_page_views: 100n,
          today_signups: 8n,
          yesterday_signups: 4n,
        },
      ];
    }

    return [
      { id: 'shop-b', name: 'Shop B', region_label: '부산', view_count: 20n },
      { id: 'shop-a', name: 'Shop A', region_label: '서울', view_count: 10n },
    ];
  }) as typeof prisma.$queryRaw;

  try {
    const stats = await getAdminStatsData();

    assert.equal(capturedQueries.length, 2);

    const summaryQuery = capturedQueries[0];
    const summaryText = summaryQuery.strings.join('');
    assert.ok(summaryText.includes('WITH page_stats AS'));
    assert.ok(summaryText.includes('user_stats AS'));
    assert.ok(summaryText.includes('COUNT(DISTINCT "session_id") FILTER'));
    assert.ok(summaryText.includes('COUNT(*) FILTER'));
    assert.ok(summaryText.includes('FROM "page_view_events"'));
    assert.ok(summaryText.includes('FROM "users"'));
    assert.equal(summaryQuery.values.length, 13);
    assert.ok(summaryQuery.values.every((value) => value instanceof Date));

    const topShopText = capturedQueries[1].strings.join('');
    assert.ok(topShopText.includes('INNER JOIN "shops" AS s ON s."id" = p."shop_id"'));
    assert.ok(topShopText.includes('GROUP BY s."id", s."name", s."region_label"'));
    assert.ok(topShopText.includes('ORDER BY COUNT(*) DESC'));
    assert.ok(topShopText.includes('LIMIT 5'));

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
  }
});

test('admin stats backend exposes a cached admin route and matching page-view index', () => {
  const routeSource = readFileSync('src/app/api/admin/stats/route.ts', 'utf8');
  assert.match(routeSource, /requireRole\('ADMIN'\)/);
  assert.match(routeSource, /getCachedAdminStatsData/);
  assert.match(routeSource, /Cache-Control': 'private, no-store'/);

  const providerSource = readFileSync('src/lib/server/admin-stats.ts', 'utf8');
  assert.match(providerSource, /unstable_cache/);
  assert.match(providerSource, /revalidate:\s*60/);

  const schemaSource = readFileSync('prisma/schema.prisma', 'utf8');
  assert.match(schemaSource, /@@index\(\[createdAt\(sort: Desc\), sessionId\]\)/);

  const migrationSource = readFileSync('prisma/migrations/0009_page_view_stats_indexes/migration.sql', 'utf8');
  assert.match(migrationSource, /page_view_events_created_at_session_id_idx/);
  assert.match(migrationSource, /\"created_at\" DESC, \"session_id\"/);
});
test('admin stats page renders cached server state and refreshes through admin API client', () => {
  const pageSource = readFileSync('src/app/admin/stats/page.tsx', 'utf8');
  const clientSource = readFileSync('src/components/admin/AdminStatsPageClient.tsx', 'utf8');

  assert.match(pageSource, /<AdminStatsPageClient initialStats=\{initialStats\} \/>/);
  assert.match(clientSource, /fetch\('\/api\/admin\/stats'/);
  assert.match(clientSource, /credentials: 'same-origin'/);
  assert.match(clientSource, /cache: 'no-store'/);
  assert.match(clientSource, /새로고침/);
});
