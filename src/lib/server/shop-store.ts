import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { Review, Shop, ShopCourse } from '@/lib/types';

export type ShopFilters = {
  region?: string;
  subRegion?: string;
  theme?: string;
  query?: string;
  sort?: string;
  regularOffset?: number;
  regularLimit?: number;
};

const REGION_MAP: Record<string, string> = {
  seoul: '서울',
  gyeonggi: '경기',
  incheon: '인천',
  busan: '부산',
  daegu: '대구',
  daejeon: '대전',
  gwangju: '광주',
  ulsan: '울산',
  sejong: '세종',
  gangwon: '강원',
  chungbuk: '충북',
  chungnam: '충남',
  jeonbuk: '전북',
  jeonnam: '전남',
  gyeongbuk: '경북',
  gyeongnam: '경남',
  jeju: '제주',
};

const shopInclude = {
  reviews: {
    where: { isHidden: false },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

function mapReview(record: any, shopName?: string): Review {
  return {
    id: record.id,
    shopId: record.shopId,
    shopName: shopName || '',
    authorName: record.authorName,
    rating: record.rating,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
  };
}

function mapShop(record: any): Shop {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    region: record.region,
    regionLabel: record.regionLabel,
    subRegion: record.subRegion || undefined,
    subRegionLabel: record.subRegionLabel || undefined,
    theme: record.theme,
    themeLabel: record.themeLabel,
    tagline: record.tagline,
    description: record.description,
    address: record.address,
    phone: record.phone,
    hours: record.hours,
    rating: record.rating,
    reviewCount: record.reviews?.length ?? 0,
    thumbnailUrl: record.thumbnailUrl || '',
    bannerUrl: record.bannerUrl || '',
    images: Array.isArray(record.images) ? record.images : [],
    courses: (record.courses as any[] || []).map((course: any) => ({
      name: course.name,
      duration: course.duration,
      price: course.price,
      description: course.description || undefined,
    })),
    tags: record.tags || [],
    isVisible: record.isVisible,
    isPremium: record.isPremium,
    premiumOrder: record.premiumOrder || undefined,
    ownerId: record.ownerId || undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildShopWhere(filters: ShopFilters): Prisma.ShopWhereInput {
  const mappedRegion = filters.region && filters.region !== 'all' ? (REGION_MAP[filters.region] ?? filters.region) : undefined;
  const query = filters.query?.trim();

  const where: Prisma.ShopWhereInput = {
    isVisible: true,
  };

  if (mappedRegion) {
    where.region = mappedRegion;
  }

  if (filters.subRegion && filters.subRegion !== 'all') {
    where.subRegion = filters.subRegion;
  }

  if (filters.theme && filters.theme !== 'all') {
    where.theme = filters.theme;
  }

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { tagline: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { regionLabel: { contains: query, mode: 'insensitive' } },
      { subRegionLabel: { contains: query, mode: 'insensitive' } },
      { themeLabel: { contains: query, mode: 'insensitive' } },
      { tags: { hasSome: [query] } },
    ];
  }

  return where;
}

export async function listShops(filters: ShopFilters = {}) {
  const regularOffset = Math.max(0, filters.regularOffset ?? 0);
  const regularLimit = filters.regularLimit && filters.regularLimit > 0 ? filters.regularLimit : undefined;

  try {
    const rawShops = await prisma.shop.findMany({
      where: buildShopWhere(filters),
      select: {
        id: true,
        name: true,
        slug: true,
        isPremium: true,
        premiumOrder: true,
        region: true,
        regionLabel: true,
        subRegion: true,
        subRegionLabel: true,
        theme: true,
        themeLabel: true,
        thumbnailUrl: true,
        bannerUrl: true,
        tagline: true,
        description: true,
        address: true,
        phone: true,
        hours: true,
        rating: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { isPremium: 'desc' },
        { premiumOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 200,
    });

    const reviewCounts =
      rawShops.length > 0
        ? await prisma.review.groupBy({
            by: ['shopId'],
            where: {
              isHidden: false,
              shopId: { in: rawShops.map((shop) => shop.id) },
            },
            _count: {
              _all: true,
            },
          }).catch(() => [])
        : [];

    const reviewCountMap = new Map<string, number>(reviewCounts.map((item) => [item.shopId, Number(item._count._all)]));

    const shops = rawShops.map((shop) => ({
      ...mapShop(shop as any),
      reviewCount: reviewCountMap.get(shop.id) ?? 0,
    }));

    const premiumShops = shops.filter((s) => s.isPremium);
    const regularShops = shops.filter((s) => !s.isPremium);
    const totalCount = shops.length;

    return {
      allShops: shops,
      premiumShops,
      regularShops: regularShops.slice(regularOffset, regularLimit ? regularOffset + regularLimit : undefined),
      regularTotal: regularShops.length,
      total: totalCount,
    };
  } catch (error) {
    return {
      allShops: [],
      premiumShops: [],
      regularShops: [],
      regularTotal: 0,
      total: 0,
    };
  }
}

export async function getShopBySlug(slug: string) {
  try {
    const shop = await prisma.shop.findFirst({
      where: { slug, isVisible: true },
      include: shopInclude,
    });

    if (!shop) {
      return null;
    }

    return {
      shop: mapShop(shop),
      reviews: (shop.reviews as any[])
        .filter((review) => !review.isHidden)
        .map((review) => mapReview(review, shop.name)),
    };
  } catch (error) {
    return null;
  }
}

export async function updateShopVisibility(shopId: string, isVisible: boolean) {
  try {
    await prisma.shop.update({
      where: { id: shopId },
      data: { isVisible },
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function updateShopPremium(shopId: string, isPremium: boolean, premiumOrder?: number) {
  try {
    await prisma.shop.update({
      where: { id: shopId },
      data: { isPremium, premiumOrder },
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function updatePremiumOrder(orderedIds: string[]) {
  try {
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.shop.update({
          where: { id },
          data: { premiumOrder: index + 1 },
        }),
      ),
    );
    return true;
  } catch (error) {
    return false;
  }
}
