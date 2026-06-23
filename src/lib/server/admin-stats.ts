import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/prisma';

import { withDatabaseRetry } from '@/lib/db/retry';
export type AdminStatsData = {
  summary: Array<{
    label: string;
    value: number;
    helperText: string;
    delta: number;
  }>;
  topShops: Array<{
    id: string;
    name: string;
    regionLabel: string;
    viewCount: number;
  }>;
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getKstStartOfDay(baseDate = new Date()) {
  const shifted = new Date(baseDate.getTime() + KST_OFFSET_MS);
  const utcMidnight = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );

  return new Date(utcMidnight - KST_OFFSET_MS);
}

function getKstStartOfMonth(baseDate = new Date()) {
  const shifted = new Date(baseDate.getTime() + KST_OFFSET_MS);
  const utcMonthStart = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    1,
  );

  return new Date(utcMonthStart - KST_OFFSET_MS);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDelta(current: number, previous: number, basisLabel: string) {
  const delta = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  return { delta, helperText: `${basisLabel} 대비 ${delta >= 0 ? '+' : ''}${delta}%` };
}

async function countSessionWindow(currentStart: Date, previousStart: Date) {
  const [row] = await withDatabaseRetry(() =>
    prisma.$queryRaw<Array<{ current: bigint | number; previous: bigint | number }>>(Prisma.sql`
      SELECT
        COUNT(DISTINCT "session_id") FILTER (WHERE "created_at" >= ${currentStart}) AS "current",
        COUNT(DISTINCT "session_id") FILTER (WHERE "created_at" >= ${previousStart} AND "created_at" < ${currentStart}) AS "previous"
      FROM "page_view_events"
      WHERE "created_at" >= ${previousStart}
    `),
  );

  return {
    current: Number(row?.current ?? 0),
    previous: Number(row?.previous ?? 0),
  };
}

export async function getAdminStatsData(): Promise<AdminStatsData> {
  const startOfTodayKst = getKstStartOfDay();
  const startOfYesterdayKst = new Date(startOfTodayKst.getTime() - DAY_MS);
  const startOfMonthKst = getKstStartOfMonth();
  const startOfLastMonthKst = getKstStartOfMonth(new Date(startOfMonthKst.getTime() - 1));

  const [todaySignups, yesterdaySignups] = await Promise.all([
    withDatabaseRetry(() => prisma.user.count({ where: { createdAt: { gte: startOfTodayKst } } })),
    withDatabaseRetry(() => prisma.user.count({ where: { createdAt: { gte: startOfYesterdayKst, lt: startOfTodayKst } } })),
  ]);
  const signupCard = {
    label: '오늘 회원가입',
    value: todaySignups,
    ...formatDelta(todaySignups, yesterdaySignups, '전일'),
  };

  try {
    const [visitorsToday, visitorsMonth, totalPageViews, thisMonthPageViews, lastMonthPageViews, topShopViewCounts] =
      await Promise.all([
        countSessionWindow(startOfTodayKst, startOfYesterdayKst),
        countSessionWindow(startOfMonthKst, startOfLastMonthKst),
        withDatabaseRetry(() => prisma.pageViewEvent.count()),
        withDatabaseRetry(() => prisma.pageViewEvent.count({ where: { createdAt: { gte: startOfMonthKst } } })),
        withDatabaseRetry(() =>
          prisma.pageViewEvent.count({ where: { createdAt: { gte: startOfLastMonthKst, lt: startOfMonthKst } } }),
        ),
        withDatabaseRetry(() =>
          prisma.pageViewEvent.groupBy({
            by: ['shopId'],
            where: {
              shopId: { not: null },
            },
            _count: {
              shopId: true,
            },
            orderBy: {
              _count: {
                shopId: 'desc',
              },
            },
            take: 5,
          }),
        ),
      ]);

    const topShopIds = topShopViewCounts
      .map((entry) => entry.shopId)
      .filter((value): value is string => Boolean(value));

    const topShopMap = new Map(
      (
        await withDatabaseRetry(() =>
          prisma.shop.findMany({
            where: { id: { in: topShopIds } },
            select: {
              id: true,
              name: true,
              regionLabel: true,
            },
          }),
        )
      ).map((shop) => [shop.id, shop]),
    );

    return {
      summary: [
        { label: '오늘 방문자', value: visitorsToday.current, ...formatDelta(visitorsToday.current, visitorsToday.previous, '전일') },
        { label: '이번 달 방문자', value: visitorsMonth.current, ...formatDelta(visitorsMonth.current, visitorsMonth.previous, '전월') },
        { label: '총 페이지뷰', value: totalPageViews, ...formatDelta(thisMonthPageViews, lastMonthPageViews, '전월') },
        signupCard,
      ],
      topShops: topShopViewCounts
        .map((entry) => {
          if (!entry.shopId) {
            return null;
          }

          const shop = topShopMap.get(entry.shopId);
          if (!shop) {
            return null;
          }

          return {
            id: shop.id,
            name: shop.name,
            regionLabel: shop.regionLabel,
            viewCount: entry._count.shopId,
          };
        })
        .filter((value): value is AdminStatsData['topShops'][number] => Boolean(value)),
    };
  } catch (error) {
    console.error('Failed to load page-view analytics; returning empty admin stats fallback.', error);

    return {
      summary: [
        { label: '오늘 방문자', value: 0, ...formatDelta(0, 0, '전일') },
        { label: '이번 달 방문자', value: 0, ...formatDelta(0, 0, '전월') },
        { label: '총 페이지뷰', value: 0, ...formatDelta(0, 0, '전월') },
        signupCard,
      ],
      topShops: [],
    };
  }
}

export const getCachedAdminStatsData = unstable_cache(
  getAdminStatsData,
  ['admin-stats-data'],
  { revalidate: 60, tags: ['admin-stats'] },
);
