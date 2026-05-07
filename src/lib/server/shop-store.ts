import { revalidateTag, unstable_cache } from 'next/cache';
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

interface DirectoryShopFilters extends ShopFilters {
  includePremium?: boolean;
}

type ShopListResponse = {
  allShops: Shop[];
  premiumShops: Shop[];
  regularShops: Shop[];
  regularTotal: number;
  total: number;
};

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

const publicShopListCache = new Map<string, Promise<ShopListResponse>>();
const publicDirectoryShopListCache = new Map<string, Promise<ShopListResponse>>();
const PUBLIC_DIRECTORY_SHOPS_CACHE_TAG = 'public-directory-shops';

function normalizeShopListCacheKey(filters: ShopFilters) {
  return JSON.stringify({
    region: filters.region ?? '',
    subRegion: filters.subRegion ?? '',
    theme: filters.theme ?? '',
    query: filters.query?.trim() ?? '',
    sort: filters.sort ?? '',
    regularOffset: Math.max(0, filters.regularOffset ?? 0),
    regularLimit: filters.regularLimit && filters.regularLimit > 0 ? filters.regularLimit : null,
  });
}

function normalizeDirectoryShopListFilters(filters: DirectoryShopFilters) {
  return {
    region: filters.region ?? '',
    subRegion: filters.subRegion ?? '',
    theme: filters.theme ?? '',
    query: filters.query?.trim() ?? '',
    sort: filters.sort ?? '',
    regularOffset: Math.max(0, filters.regularOffset ?? 0),
    regularLimit: filters.regularLimit && filters.regularLimit > 0 ? filters.regularLimit : null,
    includePremium: filters.includePremium !== false,
  };
}

function normalizeDirectoryShopListCacheKey(filters: DirectoryShopFilters) {
  return JSON.stringify(normalizeDirectoryShopListFilters(filters));
}

export function invalidatePublicShopListCache() {
  publicShopListCache.clear();
  publicDirectoryShopListCache.clear();
  revalidateTag(PUBLIC_DIRECTORY_SHOPS_CACHE_TAG, 'max');
}

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

function sortByPopularity(left: Shop, right: Shop) {
  if (right.reviewCount !== left.reviewCount) return right.reviewCount - left.reviewCount;
  if (right.rating !== left.rating) return right.rating - left.rating;
  return right.createdAt.localeCompare(left.createdAt);
}

function balancePremiumShops(shops: Shop[], region?: string) {
  if (region && region !== 'all') {
    return [...shops].sort((left, right) => (left.premiumOrder ?? 999) - (right.premiumOrder ?? 999));
  }

  const regionGroups = new Map<string, Shop[]>();
  shops.forEach((shop) => {
    const list = regionGroups.get(shop.region) || [];
    list.push(shop);
    regionGroups.set(
      shop.region,
      list.sort((a, b) => (a.premiumOrder ?? 999) - (b.premiumOrder ?? 999)),
    );
  });

  const balanced: Shop[] = [];
  const regions = Array.from(regionGroups.keys());
  const maxLen = Math.max(...Array.from(regionGroups.values()).map((list) => list.length), 0);

  for (let index = 0; index < maxLen; index += 1) {
    for (const currentRegion of regions) {
      const list = regionGroups.get(currentRegion);
      if (list?.[index]) {
        balanced.push(list[index]);
      }
    }
  }

  return balanced;
}

async function getReviewCountMap(shopIds: string[]) {
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

  return new Map<string, number>(reviewCounts.map((item) => [item.shopId, Number(item._count._all)]));
}

function getRegularOrderBy(sort?: string): Prisma.ShopOrderByWithRelationInput[] {
  if (sort === 'new') {
    return [{ createdAt: 'desc' }];
  }

  return [{ createdAt: 'desc' }];
}

async function listDirectoryShopsUncached(filters: DirectoryShopFilters = {}): Promise<ShopListResponse> {
  if (filters.sort === 'popular') {
    return listShopsUncached(filters);
  }

  const regularOffset = Math.max(0, filters.regularOffset ?? 0);
  const regularLimit = filters.regularLimit && filters.regularLimit > 0 ? filters.regularLimit : undefined;
  const includePremium = filters.includePremium !== false;
  const baseWhere = buildShopWhere(filters);
  const premiumWhere: Prisma.ShopWhereInput = {
    ...baseWhere,
    isPremium: true,
  };
  const regularWhere: Prisma.ShopWhereInput = {
    ...baseWhere,
    isPremium: false,
  };

  const [premiumRecords, regularRecords, regularTotal] = await Promise.all([
    includePremium
      ? prisma.shop.findMany({
          where: premiumWhere,
          select: shopListSelect,
          orderBy: [{ premiumOrder: 'asc' }, { createdAt: 'desc' }],
        })
      : Promise.resolve([] as ShopListRecord[]),
    prisma.shop.findMany({
      where: regularWhere,
      select: shopListSelect,
      orderBy: getRegularOrderBy(filters.sort),
      skip: regularOffset,
      ...(regularLimit ? { take: regularLimit } : {}),
    }),
    prisma.shop.count({ where: regularWhere }),
  ]);

  const reviewCountMap = await getReviewCountMap([
    ...premiumRecords.map((shop) => shop.id),
    ...regularRecords.map((shop) => shop.id),
  ]);

  const premiumShops = balancePremiumShops(
    premiumRecords.map((shop) => mapShopList(shop, reviewCountMap.get(shop.id) ?? 0)),
    filters.region,
  );
  const regularShops = regularRecords.map((shop) => mapShopList(shop, reviewCountMap.get(shop.id) ?? 0));

  return {
    allShops: [...premiumShops, ...regularShops],
    premiumShops,
    regularShops,
    regularTotal,
    total: premiumShops.length + regularTotal,
  };
}

const getPersistentDirectoryShopList = unstable_cache(
  async (serializedFilters: string) => {
    const normalized = JSON.parse(serializedFilters) as ReturnType<typeof normalizeDirectoryShopListFilters>;
    return listDirectoryShopsUncached({
      region: normalized.region || undefined,
      subRegion: normalized.subRegion || undefined,
      theme: normalized.theme || undefined,
      query: normalized.query || undefined,
      sort: normalized.sort || undefined,
      regularOffset: normalized.regularOffset,
      regularLimit: normalized.regularLimit ?? undefined,
      includePremium: normalized.includePremium,
    });
  },
  [PUBLIC_DIRECTORY_SHOPS_CACHE_TAG],
  { revalidate: 120, tags: [PUBLIC_DIRECTORY_SHOPS_CACHE_TAG] },
);

export async function listDirectoryShops(filters: DirectoryShopFilters = {}) {
  const cacheKey = normalizeDirectoryShopListCacheKey(filters);
  const cached = publicDirectoryShopListCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pending = getPersistentDirectoryShopList(cacheKey).catch((error) => {
    publicDirectoryShopListCache.delete(cacheKey);
    throw error;
  });

  publicDirectoryShopListCache.set(cacheKey, pending);
  return pending;
}

async function listShopsUncached(filters: ShopFilters = {}): Promise<ShopListResponse> {
  const regularOffset = Math.max(0, filters.regularOffset ?? 0);
  const regularLimit = filters.regularLimit && filters.regularLimit > 0 ? filters.regularLimit : undefined;
  const shops = await prisma.shop.findMany({
    where: buildShopWhere(filters),
    select: shopListSelect,
    orderBy: [{ isPremium: 'desc' }, { premiumOrder: 'asc' }, { createdAt: 'desc' }],
  });

  const reviewCountMap = await getReviewCountMap(shops.map((shop) => shop.id));

  const allShops = shops.map((shop) => mapShopList(shop, reviewCountMap.get(shop.id) ?? 0));
  const sortedShops = [...allShops];

  if (filters.sort === 'popular') {
    sortedShops.sort(sortByPopularity);
  } else if (filters.sort === 'new') {
    sortedShops.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  const premiumShops = balancePremiumShops(
    sortedShops.filter((shop) => shop.isPremium),
    filters.region,
  );
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

export async function listShops(filters: ShopFilters = {}) {
  const cacheKey = normalizeShopListCacheKey(filters);
  const cached = publicShopListCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pending = listShopsUncached(filters).catch((error) => {
    publicShopListCache.delete(cacheKey);
    throw error;
  });

  publicShopListCache.set(cacheKey, pending);
  return pending;
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
    invalidatePublicShopListCache();
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
    invalidatePublicShopListCache();
    return mapShop(shop);
  } catch {
    return null;
  }
}
