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

async function loadAdminStatsSummary(startOfTodayKst: Date, startOfYesterdayKst: Date, startOfMonthKst: Date, startOfLastMonthKst: Date) {
  const [row] = await withDatabaseRetry(() =>
    prisma.$queryRaw<
      Array<{
        today_visitors: bigint | number;
        yesterday_visitors: bigint | number;
        month_visitors: bigint | number;
        last_month_visitors: bigint | number;
        total_page_views: bigint | number;
        this_month_page_views: bigint | number;
        last_month_page_views: bigint | number;
        today_signups: bigint | number;
        yesterday_signups: bigint | number;
      }>
    >(Prisma.sql`
      WITH page_stats AS (
        SELECT
          COUNT(DISTINCT "session_id") FILTER (WHERE "created_at" >= ${startOfTodayKst}) AS "today_visitors",
          COUNT(DISTINCT "session_id") FILTER (WHERE "created_at" >= ${startOfYesterdayKst} AND "created_at" < ${startOfTodayKst}) AS "yesterday_visitors",
          COUNT(DISTINCT "session_id") FILTER (WHERE "created_at" >= ${startOfMonthKst}) AS "month_visitors",
          COUNT(DISTINCT "session_id") FILTER (WHERE "created_at" >= ${startOfLastMonthKst} AND "created_at" < ${startOfMonthKst}) AS "last_month_visitors",
          COUNT(*) AS "total_page_views",
          COUNT(*) FILTER (WHERE "created_at" >= ${startOfMonthKst}) AS "this_month_page_views",
          COUNT(*) FILTER (WHERE "created_at" >= ${startOfLastMonthKst} AND "created_at" < ${startOfMonthKst}) AS "last_month_page_views"
        FROM "page_view_events"
      ),
      user_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE "created_at" >= ${startOfTodayKst}) AS "today_signups",
          COUNT(*) FILTER (WHERE "created_at" >= ${startOfYesterdayKst} AND "created_at" < ${startOfTodayKst}) AS "yesterday_signups"
        FROM "users"
        WHERE "created_at" >= ${startOfYesterdayKst}
      )
      SELECT *
      FROM page_stats
      CROSS JOIN user_stats
    `),
  );

  return {
    todayVisitors: Number(row?.today_visitors ?? 0),
    yesterdayVisitors: Number(row?.yesterday_visitors ?? 0),
    monthVisitors: Number(row?.month_visitors ?? 0),
    lastMonthVisitors: Number(row?.last_month_visitors ?? 0),
    totalPageViews: Number(row?.total_page_views ?? 0),
    thisMonthPageViews: Number(row?.this_month_page_views ?? 0),
    lastMonthPageViews: Number(row?.last_month_page_views ?? 0),
    todaySignups: Number(row?.today_signups ?? 0),
    yesterdaySignups: Number(row?.yesterday_signups ?? 0),
  };
}

async function loadTopShopViews() {
  const rows = await withDatabaseRetry(() =>
    prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        region_label: string;
        view_count: bigint | number;
      }>
    >(Prisma.sql`
      SELECT
        s."id",
        s."name",
        s."region_label",
        COUNT(*) AS "view_count"
      FROM "page_view_events" AS p
      INNER JOIN "shops" AS s ON s."id" = p."shop_id"
      WHERE p."shop_id" IS NOT NULL
      GROUP BY s."id", s."name", s."region_label"
      ORDER BY COUNT(*) DESC, s."name" ASC
      LIMIT 5
    `),
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    regionLabel: row.region_label,
    viewCount: Number(row.view_count),
  }));
}

export async function getAdminStatsData(): Promise<AdminStatsData> {
  const startOfTodayKst = getKstStartOfDay();
  const startOfYesterdayKst = new Date(startOfTodayKst.getTime() - DAY_MS);
  const startOfMonthKst = getKstStartOfMonth();
  const startOfLastMonthKst = getKstStartOfMonth(new Date(startOfMonthKst.getTime() - 1));

  try {
    const [summaryStats, topShops] = await Promise.all([
      loadAdminStatsSummary(startOfTodayKst, startOfYesterdayKst, startOfMonthKst, startOfLastMonthKst),
      loadTopShopViews(),
    ]);

    return {
      summary: [
        {
          label: '오늘 방문자',
          value: summaryStats.todayVisitors,
          ...formatDelta(summaryStats.todayVisitors, summaryStats.yesterdayVisitors, '전일'),
        },
        {
          label: '이번 달 방문자',
          value: summaryStats.monthVisitors,
          ...formatDelta(summaryStats.monthVisitors, summaryStats.lastMonthVisitors, '전월'),
        },
        {
          label: '총 페이지뷰',
          value: summaryStats.totalPageViews,
          ...formatDelta(summaryStats.thisMonthPageViews, summaryStats.lastMonthPageViews, '전월'),
        },
        {
          label: '오늘 회원가입',
          value: summaryStats.todaySignups,
          ...formatDelta(summaryStats.todaySignups, summaryStats.yesterdaySignups, '전일'),
        },
      ],
      topShops,
    };
  } catch (error) {
    console.error('Failed to load admin stats data; returning empty admin stats fallback.', error);

    return {
      summary: [
        { label: '오늘 방문자', value: 0, ...formatDelta(0, 0, '전일') },
        { label: '이번 달 방문자', value: 0, ...formatDelta(0, 0, '전월') },
        { label: '총 페이지뷰', value: 0, ...formatDelta(0, 0, '전월') },
        { label: '오늘 회원가입', value: 0, ...formatDelta(0, 0, '전일') },
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
