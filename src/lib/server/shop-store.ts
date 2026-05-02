import type { Prisma, Review as DbReview, Shop as DbShop, ShopCourse, ShopImage } from '@prisma/client';
import type { Review, Shop } from '@/lib/types';
import { REGION_MAP } from '@/lib/catalog';
import { prisma } from '@/lib/db/prisma';

interface ShopFilters {
  region?: string;
  subRegion?: string;
  theme?: string;
  query?: string;
  sort?: string;
  regularOffset?: number;
  regularLimit?: number;
}

export type ShopRecord = DbShop & {
  images: ShopImage[];
  courses: ShopCourse[];
  reviews: DbReview[];
};

export const shopInclude = {
  images: true,
  courses: true,
  reviews: true,
} satisfies Prisma.ShopInclude;

const shopListSelect = {
  id: true,
  ownerId: true,
  name: true,
  slug: true,
  region: true,
  regionLabel: true,
  subRegion: true,
  subRegionLabel: true,
  theme: true,
  themeLabel: true,
  isPremium: true,
  premiumOrder: true,
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
  courses: {
    orderBy: { sortOrder: 'asc' },
    take: 1,
    select: {
      name: true,
      durationMinutes: true,
      price: true,
      description: true,
    },
  },
} satisfies Prisma.ShopSelect;

export type ShopListRecord = Prisma.ShopGetPayload<{
  select: typeof shopListSelect;
}>;

export function mapShop(record: ShopRecord): Shop {
  const visibleReviews = record.reviews.filter((review) => !review.isHidden);

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    region: record.region,
    regionLabel: record.regionLabel,
    subRegion: record.subRegion ?? undefined,
    subRegionLabel: record.subRegionLabel ?? undefined,
    theme: record.theme,
    themeLabel: record.themeLabel,
    isPremium: record.isPremium,
    premiumOrder: record.premiumOrder ?? undefined,
    thumbnailUrl: record.thumbnailUrl ?? record.images[0]?.imageUrl ?? '',
    bannerUrl: record.bannerUrl ?? record.images[0]?.imageUrl ?? '',
    images: [...record.images]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((image) => image.imageUrl),
    tagline: record.tagline,
    description: record.description,
    address: record.address,
    phone: record.phone,
    hours: record.hours,
    rating: record.rating,
    reviewCount: visibleReviews.length,
    courses: [...record.courses]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((course) => ({
        name: course.name,
        duration: `${course.durationMinutes} min`,
        price: `${course.price}`,
        description: course.description ?? undefined,
      })),
    tags: record.tags,
    isVisible: record.isVisible,
    ownerId: record.ownerId ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapReview(review: DbReview, shopName: string): Review {
  return {
    id: review.id,
    shopId: review.shopId,
    shopName,
    authorName: review.authorName,
    rating: review.rating,
    content: review.content,
    createdAt: review.createdAt.toISOString(),
  };
}

function mapShopList(record: ShopListRecord, reviewCount: number): Shop {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    region: record.region,
    regionLabel: record.regionLabel,
    subRegion: record.subRegion ?? undefined,
    subRegionLabel: record.subRegionLabel ?? undefined,
    theme: record.theme,
    themeLabel: record.themeLabel,
    isPremium: record.isPremium,
    premiumOrder: record.premiumOrder ?? undefined,
    thumbnailUrl: record.thumbnailUrl ?? '',
    bannerUrl: record.bannerUrl ?? '',
    images: [],
    tagline: record.tagline,
    description: record.description,
    address: record.address,
    phone: record.phone,
    hours: record.hours,
    rating: record.rating,
    reviewCount,
    courses: record.courses.map((course) => ({
      name: course.name,
      duration: `${course.durationMinutes} min`,
      price: `${course.price}`,
      description: course.description ?? undefined,
    })),
    tags: record.tags,
    isVisible: true,
    ownerId: record.ownerId ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildShopWhere(filters: ShopFilters): Prisma.ShopWhereInput {
  const mappedRegion = filters.region && filters.region !== 'all' ? (REGION_MAP[filters.region] ?? filters.region) : undefined;

  return {
    isVisible: true,
    ...(mappedRegion ? { region: mappedRegion } : {}),
    ...(filters.subRegion && filters.subRegion !== 'all' ? { subRegion: filters.subRegion } : {}),
    ...(filters.theme && filters.theme !== 'all' ? { theme: filters.theme } : {}),
    ...(filters.query
      ? {
          OR: [
            { name: { contains: filters.query, mode: 'insensitive' } },
            { regionLabel: { contains: filters.query, mode: 'insensitive' } },
            { subRegionLabel: { contains: filters.query, mode: 'insensitive' } },
            { themeLabel: { contains: filters.query, mode: 'insensitive' } },
            { tagline: { contains: filters.query, mode: 'insensitive' } },
            { description: { contains: filters.query, mode: 'insensitive' } },
            { tags: { has: filters.query } },
          ],
        }
      : {}),
  };
}

export async function listShops(filters: ShopFilters = {}) {
  const regularOffset = Math.max(0, filters.regularOffset ?? 0);
  const regularLimit = filters.regularLimit && filters.regularLimit > 0 ? filters.regularLimit : undefined;
  const shops = await prisma.shop.findMany({
    where: buildShopWhere(filters),
    select: shopListSelect,
    orderBy: [{ isPremium: 'desc' }, { premiumOrder: 'asc' }, { createdAt: 'desc' }],
  });

  const reviewCounts =
    shops.length > 0
      ? await prisma.review.groupBy({
          by: ['shopId'],
          where: {
            isHidden: false,
            shopId: { in: shops.map((shop) => shop.id) },
          },
          _count: {
            _all: true,
          },
        })
      : [];

  const reviewCountMap = new Map<string, number>(reviewCounts.map((item) => [item.shopId, Number(item._count._all)]));

  const allShops = shops.map((shop) => mapShopList(shop, reviewCountMap.get(shop.id) ?? 0));
  const sortedShops = [...allShops];

  if (filters.sort === 'popular') {
    sortedShops.sort((left, right) => {
      if (right.reviewCount !== left.reviewCount) return right.reviewCount - left.reviewCount;
      if (right.rating !== left.rating) return right.rating - left.rating;
      return right.createdAt.localeCompare(left.createdAt);
    });
  } else if (filters.sort === 'new') {
    sortedShops.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  const premiumShopsRaw = sortedShops.filter((shop) => shop.isPremium);

  // 전체 지역 조회 시 특정 지역 독점을 방지하기 위해 지역별 안배 로직 적용
  let premiumShops: Shop[];
  if (!filters.region || filters.region === 'all') {
    const regionGroups = new Map<string, Shop[]>();
    premiumShopsRaw.forEach((shop) => {
      const list = regionGroups.get(shop.region) || [];
      list.push(shop);
      regionGroups.set(
        shop.region,
        list.sort((a, b) => (a.premiumOrder ?? 999) - (b.premiumOrder ?? 999)),
      );
    });

    const balanced: Shop[] = [];
    const regions = Array.from(regionGroups.keys());
    const maxLen = Math.max(...Array.from(regionGroups.values()).map((l) => l.length), 0);

    for (let i = 0; i < maxLen; i++) {
      for (const reg of regions) {
        const list = regionGroups.get(reg);
        if (list && list[i]) {
          balanced.push(list[i]);
        }
      }
    }
    premiumShops = balanced;
  } else {
    premiumShops = premiumShopsRaw.sort((left, right) => (left.premiumOrder ?? 999) - (right.premiumOrder ?? 999));
  }
  const allRegularShops = sortedShops.filter((shop) => !shop.isPremium);
  const regularShops = regularLimit ? allRegularShops.slice(regularOffset, regularOffset + regularLimit) : allRegularShops;

  return {
    allShops: sortedShops,
    premiumShops,
    regularShops,
    regularTotal: allRegularShops.length,
    total: sortedShops.length,
  };
}

export async function getShopBySlug(slug: string) {
  const shop = await prisma.shop.findFirst({
    where: { slug, isVisible: true },
    include: shopInclude,
  });

  if (!shop) {
    return null;
  }

  return {
    shop: mapShop(shop),
    reviews: shop.reviews
      .filter((review) => !review.isHidden)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((review) => mapReview(review, shop.name)),
  };
}

export async function updateShopVisibility(shopId: string, isVisible: boolean) {
  try {
    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: { isVisible },
      include: shopInclude,
    });
    return mapShop(shop);
  } catch {
    return null;
  }
}

export async function updateShopPremium(shopId: string, isPremium: boolean, premiumOrder?: number) {
  try {
    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        isPremium,
        premiumOrder: isPremium ? premiumOrder ?? 1 : null,
      },
      include: shopInclude,
    });
    return mapShop(shop);
  } catch {
    return null;
  }
}
