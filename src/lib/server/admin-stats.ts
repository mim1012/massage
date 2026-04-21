import { prisma } from '@/lib/db/prisma';

export type AdminStatsData = {
  summary: Array<{
    label: string;
    value: number;
    helperText: string;
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

export async function getAdminStatsData(): Promise<AdminStatsData> {
  const startOfTodayKst = getKstStartOfDay();
  const startOfMonthKst = getKstStartOfMonth();

  const todaySignups = await prisma.user.count({
    where: {
      createdAt: { gte: startOfTodayKst },
    },
  });

  try {
    const [todayVisitors, monthlyVisitors, totalPageViews, topShopViewCounts] = await Promise.all([
      prisma.pageViewEvent.groupBy({
        by: ['sessionId'],
        where: {
          createdAt: { gte: startOfTodayKst },
        },
      }),
      prisma.pageViewEvent.groupBy({
        by: ['sessionId'],
        where: {
          createdAt: { gte: startOfMonthKst },
        },
      }),
      prisma.pageViewEvent.count(),
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
    ]);

    const topShopIds = topShopViewCounts
      .map((entry) => entry.shopId)
      .filter((value): value is string => Boolean(value));

    const topShopMap = new Map(
      (
        await prisma.shop.findMany({
          where: { id: { in: topShopIds } },
          select: {
            id: true,
            name: true,
            regionLabel: true,
          },
        })
      ).map((shop) => [shop.id, shop]),
    );

    return {
      summary: [
        { label: '오늘 방문자', value: todayVisitors.length, helperText: 'KST 기준 고유 세션 수' },
        { label: '이번 달 방문자', value: monthlyVisitors.length, helperText: 'KST 기준 월간 고유 세션 수' },
        { label: '총 페이지뷰', value: totalPageViews, helperText: '누적 페이지 조회 이벤트 수' },
        { label: '오늘 회원가입', value: todaySignups, helperText: 'KST 기준 오늘 생성된 계정 수' },
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
        { label: '오늘 방문자', value: 0, helperText: '페이지뷰 테이블 미구성 시 0으로 표시됩니다.' },
        { label: '이번 달 방문자', value: 0, helperText: '페이지뷰 테이블 미구성 시 0으로 표시됩니다.' },
        { label: '총 페이지뷰', value: 0, helperText: '페이지뷰 테이블 미구성 시 0으로 표시됩니다.' },
        { label: '오늘 회원가입', value: todaySignups, helperText: 'KST 기준 오늘 생성된 계정 수' },
      ],
      topShops: [],
    };
  }
}
