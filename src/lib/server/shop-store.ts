import { revalidateTag, unstable_cache } from 'next/cache';
import type { Prisma, Review as DbReview, Shop as DbShop, ShopCourse, ShopImage } from '@prisma/client';
import type { Review, Shop, ShopListItem } from '@/lib/types';
import { REGION_MAP } from '@/lib/catalog';
import { prisma } from '@/lib/db/prisma';

export type ShopFilters = {
  region?: string;
  subRegion?: string;
  theme?: string;
  query?: string;
  sort?: string;
  regularOffset?: number;
  regularLimit?: number;
};

interface DirectoryShopFilters extends ShopFilters {
  includePremium?: boolean;
}

type ShopListResponse = {
  allShops: ShopListItem[];
  premiumShops: ShopListItem[];
  regularShops: ShopListItem[];
  regularTotal: number;
  total: number;
};

export type ShopRecord = DbShop & {
  images: ShopImage[];
  courses: ShopCourse[];
  reviews: DbReview[];
};

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
      price: true,
    },
  },
  _count: {
    select: {
      reviews: {
        where: {
          isHidden: false,
        },
      },
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
  try {
    revalidateTag(PUBLIC_DIRECTORY_SHOPS_CACHE_TAG);
  } catch {
    // Ignore cache invalidation errors
  }
}

const shopInclude = {
  reviews: {
    where: { isHidden: false },
    orderBy: { createdAt: 'desc' as const },
  },
  courses: {
    orderBy: { sortOrder: 'asc' as const },
  },
  images: {
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

export function mapShop(record: any): Shop {
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
    reviewCount: record.reviews?.length ?? record._count?.reviews ?? 0,
    thumbnailUrl: record.thumbnailUrl || '',
    bannerUrl: record.bannerUrl || '',
    images: Array.isArray(record.images) ? record.images.map((img: any) => img.imageUrl) : [],
    courses: (record.courses as any[] || []).map((course: any) => ({
      name: course.name || '',
      duration: course.durationMinutes ? `${course.durationMinutes}분` : '',
      price: `${course.price}`,
      description: course.description || undefined,
    })),
    tags: record.tags || [],
    isVisible: record.isVisible ?? true,
    isPremium: record.isPremium ?? false,
    premiumOrder: record.premiumOrder || undefined,
    ownerId: record.ownerId || undefined,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
  };
}

function mapShopList(record: ShopListRecord): ShopListItem {
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
    isPremium: record.isPremium,
    premiumOrder: record.premiumOrder ?? undefined,
    thumbnailUrl: record.thumbnailUrl ?? '',
    bannerUrl: record.bannerUrl ?? '',
    tagline: record.tagline,
    rating: record.rating,
    reviewCount: record._count.reviews,
    courses: record.courses.map((course) => ({
      name: '',
      duration: '',
      price: `${course.price}`,
    })),
    tags: record.tags,
    createdAt: record.createdAt.toISOString(),
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

function sortByPopularity(left: ShopListItem, right: ShopListItem) {
  if (right.reviewCount !== left.reviewCount) return right.reviewCount - left.reviewCount;
  if (right.rating !== left.rating) return right.rating - left.rating;
  return right.createdAt.localeCompare(left.createdAt);
}

function balancePremiumShops(shops: ShopListItem[], region?: string) {
  if (region && region !== 'all') {
    return [...shops].sort((left, right) => (left.premiumOrder ?? 999) - (right.premiumOrder ?? 999));
  }

  const regionGroups = new Map<string, ShopListItem[]>();
  shops.forEach((shop) => {
    const list = regionGroups.get(shop.region) || [];
    list.push(shop);
    regionGroups.set(
      shop.region,
      list.sort((a, b) => (a.premiumOrder ?? 999) - (b.premiumOrder ?? 999)),
    );
  });

  const balanced: ShopListItem[] = [];
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

function getRegularOrderBy(sort?: string): Prisma.ShopOrderByWithRelationInput[] {
  if (sort === 'new') {
    return [{ createdAt: 'desc' }];
  }
  return [{ createdAt: 'desc' }];
}

async function listDirectoryShopsUncached(filters: DirectoryShopFilters = {}): Promise<ShopListResponse> {
  try {
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

    const premiumShops = balancePremiumShops(
      premiumRecords.map((shop) => mapShopList(shop)),
      filters.region,
    );
    const regularShops = regularRecords.map((shop) => mapShopList(shop));

    return {
      allShops: [...premiumShops, ...regularShops],
      premiumShops,
      regularShops,
      regularTotal,
      total: premiumShops.length + regularTotal,
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

const getPersistentDirectoryShopList = unstable_cache(
  async (serializedFilters: string) => {
    try {
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
    } catch {
      return { allShops: [], premiumShops: [], regularShops: [], regularTotal: 0, total: 0 };
    }
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
    return { allShops: [], premiumShops: [], regularShops: [], regularTotal: 0, total: 0 };
  });

  publicDirectoryShopListCache.set(cacheKey, pending);
  return pending;
}

async function listShopsUncached(filters: ShopFilters = {}): Promise<ShopListResponse> {
  try {
    const regularOffset = Math.max(0, filters.regularOffset ?? 0);
    const regularLimit = filters.regularLimit && filters.regularLimit > 0 ? filters.regularLimit : undefined;

    const shops = await prisma.shop.findMany({
      where: buildShopWhere(filters),
      select: shopListSelect,
    });

    const allShops = shops.map((shop) => mapShopList(shop));
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

export async function listShops(filters: ShopFilters = {}) {
  const cacheKey = normalizeShopListCacheKey(filters);
  const cached = publicShopListCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pending = listShopsUncached(filters).catch((error) => {
    publicShopListCache.delete(cacheKey);
    return { allShops: [], premiumShops: [], regularShops: [], regularTotal: 0, total: 0 };
  });

  publicShopListCache.set(cacheKey, pending);
  return pending;
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
        .map((review) => ({
          id: review.id,
          shopId: review.shopId,
          shopName: shop.name,
          authorName: review.authorName,
          rating: review.rating,
          content: review.content,
          createdAt: review.createdAt.toISOString(),
        })),
    };
  } catch (error) {
    return null;
  }
}

export async function updateShopVisibility(shopId: string, isVisible: boolean) {
  try {
    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: { isVisible },
    });
    invalidatePublicShopListCache();
    return true;
  } catch {
    return false;
  }
}

export async function updateShopPremium(shopId: string, isPremium: boolean, premiumOrder?: number) {
  try {
    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: { isPremium, premiumOrder },
    });
    invalidatePublicShopListCache();
    return true;
  } catch {
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
    invalidatePublicShopListCache();
    return true;
  } catch (error) {
    return false;
  }
}
