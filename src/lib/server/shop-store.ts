import type { Prisma, Review as DbReview, Shop as DbShop, ShopCourse, ShopImage } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import type { Review, Shop } from '@/lib/types';
import { REGION_MAP } from '@/lib/catalog';
import { deriveStructuredSearchIntent } from '@/lib/structured-search';
import { prisma } from '@/lib/db/prisma';

const SHOP_LIST_CACHE_REVALIDATE_SECONDS = 30;

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
  images: { orderBy: { sortOrder: 'asc' } },
  courses: { orderBy: { sortOrder: 'asc' } },
  reviews: { where: { isHidden: false }, orderBy: { createdAt: 'desc' } },
} satisfies Prisma.ShopInclude;

const shopListSelect = {
  id: true,
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
  rating: true,
  tags: true,
  createdAt: true,
  courses: {
    orderBy: { sortOrder: 'asc' },
    take: 1,
    select: {
      name: true,
      durationMinutes: true,
      price: true,
    },
  },
} satisfies Prisma.ShopSelect;

export type ShopListRecord = Prisma.ShopGetPayload<{
  select: typeof shopListSelect;
}>;

export function mapShop(record: ShopRecord): Shop {
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
    images: record.images.map((image) => image.imageUrl),
    tagline: record.tagline,
    description: record.description,
    address: record.address,
    phone: record.phone,
    hours: record.hours,
    rating: record.rating,
    reviewCount: record.reviews.length,
    courses: record.courses.map((course) => ({
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
    description: '',
    address: '',
    phone: '',
    hours: '',
    rating: record.rating,
    reviewCount,
    courses: record.courses.map((course) => ({
      name: course.name,
      duration: `${course.durationMinutes} min`,
      price: `${course.price}`,
      description: undefined,
    })),
    tags: record.tags,
    isVisible: true,
    ownerId: undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.createdAt.toISOString(),
  };
}

function buildReviewCountMap(items: Array<{ shopId: string; _count: { _all: number } }>) {
  return new Map<string, number>(items.map((item) => [item.shopId, Number(item._count._all)]));
}

async function fetchReviewCountMap(shopIds: string[]) {
  if (shopIds.length === 0) {
    return new Map<string, number>();
  }

  const reviewCounts = await prisma.review.groupBy({
    by: ['shopId'],
    where: {
      isHidden: false,
      shopId: { in: shopIds },
    },
    _count: {
      _all: true,
    },
  });

  return buildReviewCountMap(reviewCounts);
}

function normalizeShopFilters(filters: ShopFilters = {}): ShopFilters {
  const normalizeValue = (value?: string) => value?.trim() || undefined;
  const normalizedQuery = normalizeValue(filters.query);
  const searchIntent = deriveStructuredSearchIntent(normalizedQuery);

  return {
    region: normalizeValue(filters.region) ?? searchIntent.region,
    subRegion: normalizeValue(filters.subRegion) ?? searchIntent.subRegion,
    theme: normalizeValue(filters.theme) ?? searchIntent.theme,
    query: searchIntent.freeText,
    sort: normalizeValue(filters.sort),
    regularOffset: Math.max(0, filters.regularOffset ?? 0),
    regularLimit: filters.regularLimit && filters.regularLimit > 0 ? filters.regularLimit : undefined,
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
            { tags: { has: filters.query } },
          ],
        }
      : {}),
  };
}

async function queryShops(filters: ShopFilters = {}) {
  const normalizedFilters = normalizeShopFilters(filters);
  const regularOffset = normalizedFilters.regularOffset ?? 0;
  const regularLimit = normalizedFilters.regularLimit;
  const where = buildShopWhere(normalizedFilters);

  if (regularLimit && normalizedFilters.sort !== 'popular') {
    const premiumWhere: Prisma.ShopWhereInput = { ...where, isPremium: true };
    const regularWhere: Prisma.ShopWhereInput = { ...where, isPremium: false };

    const [premiumRecords, regularRecords, regularTotal] = await Promise.all([
      prisma.shop.findMany({
        where: premiumWhere,
        select: shopListSelect,
        orderBy: [{ premiumOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.shop.findMany({
        where: regularWhere,
        select: shopListSelect,
        orderBy: [{ createdAt: 'desc' }],
        skip: regularOffset,
        take: regularLimit,
      }),
      prisma.shop.count({ where: regularWhere }),
    ]);

    const reviewCountMap = await fetchReviewCountMap([
      ...premiumRecords.map((shop) => shop.id),
      ...regularRecords.map((shop) => shop.id),
    ]);

    const premiumShops = premiumRecords.map((shop) => mapShopList(shop, reviewCountMap.get(shop.id) ?? 0));
    const regularShops = regularRecords.map((shop) => mapShopList(shop, reviewCountMap.get(shop.id) ?? 0));

    return {
      allShops: [...premiumShops, ...regularShops],
      premiumShops,
      regularShops,
      regularTotal,
      total: premiumShops.length + regularTotal,
    };
  }

  const shops = await prisma.shop.findMany({
    where,
    select: shopListSelect,
    orderBy: [{ isPremium: 'desc' }, { premiumOrder: 'asc' }, { createdAt: 'desc' }],
  });

  const reviewCountMap = await fetchReviewCountMap(shops.map((shop) => shop.id));

  const allShops = shops.map((shop) => mapShopList(shop, reviewCountMap.get(shop.id) ?? 0));
  const sortedShops = [...allShops];

  if (normalizedFilters.sort === 'popular') {
    sortedShops.sort((left, right) => {
      if (right.reviewCount !== left.reviewCount) return right.reviewCount - left.reviewCount;
      if (right.rating !== left.rating) return right.rating - left.rating;
      return right.createdAt.localeCompare(left.createdAt);
    });
  } else if (normalizedFilters.sort === 'new') {
    sortedShops.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  const premiumShops = sortedShops
    .filter((shop) => shop.isPremium)
    .sort((left, right) => (left.premiumOrder ?? 999) - (right.premiumOrder ?? 999));
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


const listShopsCached = unstable_cache(async (filters: ShopFilters) => queryShops(filters), ['shop-list-v3'], {
  revalidate: SHOP_LIST_CACHE_REVALIDATE_SECONDS,
});

export async function listShops(filters: ShopFilters = {}) {
  return await listShopsCached(normalizeShopFilters(filters));
}

const getShopBySlugCached = cache(async (slug: string) => {
  const shop = await prisma.shop.findFirst({
    where: { slug, isVisible: true },
    include: shopInclude,
  });

  if (!shop) {
    return null;
  }

  return {
    shop: mapShop(shop),
    reviews: shop.reviews.map((review) => mapReview(review, shop.name)),
  };
});

export async function getShopBySlug(slug: string) {
  return getShopBySlugCached(slug);
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
