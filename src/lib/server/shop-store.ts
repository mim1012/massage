import { Prisma, type Review as DbReview, type Shop as DbShop, type ShopCourse, type ShopImage } from '@prisma/client';
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

type SearchPageHitRow = {
  id: string;
  bucket: number;
  sort_index: number;
};

type SearchCountRow = {
  total: number | bigint;
};

type RawSearchShopRow = {
  id: string;
  name: string;
  slug: string;
  region: string;
  region_label: string;
  sub_region: string | null;
  sub_region_label: string | null;
  theme: string;
  theme_label: string;
  is_premium: boolean;
  premium_order: number | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  tagline: string;
  rating: number;
  tags: string[];
  created_at: string | Date;
  review_count: number;
  course_name: string | null;
  duration_minutes: number | null;
  price: number | null;
};

type RawSearchSummaryRow = {
  shops: Prisma.JsonValue;
  regular_total: number | bigint;
};

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

function mapRawSearchShop(record: RawSearchShopRow): Shop {
  const createdAt = record.created_at instanceof Date ? record.created_at.toISOString() : new Date(record.created_at).toISOString();

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    region: record.region,
    regionLabel: record.region_label,
    subRegion: record.sub_region ?? undefined,
    subRegionLabel: record.sub_region_label ?? undefined,
    theme: record.theme,
    themeLabel: record.theme_label,
    isPremium: record.is_premium,
    premiumOrder: record.premium_order ?? undefined,
    thumbnailUrl: record.thumbnail_url ?? '',
    bannerUrl: record.banner_url ?? '',
    images: [],
    tagline: record.tagline,
    description: '',
    address: '',
    phone: '',
    hours: '',
    rating: record.rating,
    reviewCount: Number(record.review_count ?? 0),
    courses: record.course_name
      ? [{
          name: record.course_name,
          duration: `${record.duration_minutes ?? 0} min`,
          price: `${record.price ?? 0}`,
          description: undefined,
        }]
      : [],
    tags: Array.isArray(record.tags) ? record.tags : [],
    isVisible: true,
    ownerId: undefined,
    createdAt,
    updatedAt: createdAt,
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

function getMappedRegion(region?: string) {
  return region && region !== 'all' ? (REGION_MAP[region] ?? region) : undefined;
}

function buildShopWhere(filters: ShopFilters): Prisma.ShopWhereInput {
  const mappedRegion = getMappedRegion(filters.region);

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

function buildRawSearchWhereSql(filters: ShopFilters) {
  if (!filters.query) {
    throw new Error('buildRawSearchWhereSql requires filters.query');
  }

  const mappedRegion = getMappedRegion(filters.region);
  const exactQuery = filters.query;
  const prefixQuery = `${filters.query}%`;
  const containsQuery = `%${filters.query}%`;
  const conditions: Prisma.Sql[] = [Prisma.sql`"is_visible" = true`];

  if (mappedRegion) {
    conditions.push(Prisma.sql`"region" = ${mappedRegion}`);
  }

  if (filters.subRegion && filters.subRegion !== 'all') {
    conditions.push(Prisma.sql`"sub_region" = ${filters.subRegion}`);
  }

  if (filters.theme && filters.theme !== 'all') {
    conditions.push(Prisma.sql`"theme" = ${filters.theme}`);
  }

  conditions.push(Prisma.sql`(
    "name" ILIKE ${containsQuery}
    OR "region_label" ILIKE ${containsQuery}
    OR COALESCE("sub_region_label", '') ILIKE ${containsQuery}
    OR "theme_label" ILIKE ${containsQuery}
    OR EXISTS (SELECT 1 FROM unnest("tags") AS tag WHERE tag ILIKE ${containsQuery})
  )`);

  const searchRankSql = Prisma.sql`(
    CASE WHEN "name" ILIKE ${exactQuery} THEN 120 ELSE 0 END +
    CASE WHEN "name" ILIKE ${prefixQuery} THEN 60 ELSE 0 END +
    CASE WHEN "name" ILIKE ${containsQuery} THEN 30 ELSE 0 END +
    CASE WHEN "region_label" ILIKE ${exactQuery} THEN 24 ELSE 0 END +
    CASE WHEN COALESCE("sub_region_label", '') ILIKE ${exactQuery} THEN 24 ELSE 0 END +
    CASE WHEN "theme_label" ILIKE ${exactQuery} THEN 24 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM unnest("tags") AS tag WHERE tag ILIKE ${exactQuery}) THEN 18 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM unnest("tags") AS tag WHERE tag ILIKE ${containsQuery}) THEN 9 ELSE 0 END
  )`;

  return {
    whereSql: Prisma.sql`${Prisma.join(conditions, ' AND ')}`,
    searchRankSql,
  };
}

async function queryRawSearchShops(filters: ShopFilters) {
  const normalizedFilters = normalizeShopFilters(filters);
  const regularOffset = normalizedFilters.regularOffset ?? 0;
  const regularLimit = normalizedFilters.regularLimit;

  if (!normalizedFilters.query || !regularLimit || normalizedFilters.sort === 'popular') {
    return null;
  }

  const { whereSql, searchRankSql } = buildRawSearchWhereSql(normalizedFilters);

  const summaryRows = await prisma.$queryRaw<RawSearchSummaryRow[]>(Prisma.sql`
    WITH filtered AS (
      SELECT
        s."id",
        s."is_premium",
        s."premium_order",
        s."created_at",
        ${searchRankSql} AS search_rank
      FROM "shops" s
      WHERE ${whereSql}
    ),
    regular_total AS (
      SELECT COUNT(*)::bigint AS regular_total
      FROM filtered
      WHERE "is_premium" = false
    ),
    premium_hits AS (
      SELECT
        "id",
        0 AS bucket,
        ROW_NUMBER() OVER (ORDER BY "premium_order" ASC NULLS LAST, search_rank DESC, "created_at" DESC) AS sort_index
      FROM filtered
      WHERE "is_premium" = true
    ),
    regular_hits AS (
      SELECT
        "id",
        1 AS bucket,
        ROW_NUMBER() OVER (ORDER BY search_rank DESC, "created_at" DESC) AS sort_index
      FROM filtered
      WHERE "is_premium" = false
    ),
    selected_hits AS (
      SELECT "id", bucket, sort_index FROM premium_hits
      UNION ALL
      SELECT "id", bucket, sort_index
      FROM regular_hits
      WHERE sort_index > ${regularOffset} AND sort_index <= ${regularOffset + regularLimit}
    ),
    review_counts AS (
      SELECT r."shop_id", COUNT(*)::int AS review_count
      FROM "reviews" r
      JOIN selected_hits sh ON sh."id" = r."shop_id"
      WHERE r."is_hidden" = false
      GROUP BY r."shop_id"
    ),
    first_courses AS (
      SELECT DISTINCT ON (c."shop_id")
        c."shop_id",
        c."name",
        c."duration_minutes",
        c."price"
      FROM "shop_courses" c
      JOIN selected_hits sh ON sh."id" = c."shop_id"
      ORDER BY c."shop_id", c."sort_order" ASC
    ),
    result_rows AS (
      SELECT
        sh.bucket,
        sh.sort_index,
        s."id",
        s."name",
        s."slug",
        s."region",
        s."region_label",
        s."sub_region",
        s."sub_region_label",
        s."theme",
        s."theme_label",
        s."is_premium",
        s."premium_order",
        s."thumbnail_url",
        s."banner_url",
        s."tagline",
        s."rating",
        s."tags",
        s."created_at",
        COALESCE(rc.review_count, 0) AS review_count,
        fc."name" AS course_name,
        fc."duration_minutes",
        fc."price"
      FROM selected_hits sh
      JOIN "shops" s ON s."id" = sh."id"
      LEFT JOIN review_counts rc ON rc."shop_id" = s."id"
      LEFT JOIN first_courses fc ON fc."shop_id" = s."id"
    )
    SELECT
      COALESCE(
        json_agg(row_to_json(result_rows) ORDER BY result_rows.bucket ASC, result_rows.sort_index ASC)
        FILTER (WHERE result_rows."id" IS NOT NULL),
        '[]'::json
      ) AS shops,
      regular_total.regular_total
    FROM regular_total
    LEFT JOIN result_rows ON TRUE
    GROUP BY regular_total.regular_total
  `);

  const summaryRow = summaryRows[0];
  const regularTotal = Number(summaryRow?.regular_total ?? 0);
  const rawShops = Array.isArray(summaryRow?.shops) ? (summaryRow.shops as unknown as RawSearchShopRow[]) : [];
  const mappedShops = rawShops.map(mapRawSearchShop);
  const premiumShops = mappedShops.filter((shop) => shop.isPremium);
  const regularShops = mappedShops.filter((shop) => !shop.isPremium);

  return {
    allShops: mappedShops,
    premiumShops,
    regularShops,
    regularTotal,
    total: premiumShops.length + regularTotal,
  };
}

async function queryShops(filters: ShopFilters = {}) {
  const normalizedFilters = normalizeShopFilters(filters);
  const rawSearchResult = await queryRawSearchShops(normalizedFilters);

  if (rawSearchResult) {
    return rawSearchResult;
  }
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


const listShopsCached = unstable_cache(async (filters: ShopFilters) => queryShops(filters), ['shop-list-v5'], {
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
