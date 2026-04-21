import type { Prisma, Review as DbReview, Shop as DbShop, ShopCourse, ShopImage } from '@prisma/client';
import type { Review, Shop } from '@/lib/types';
import { prisma } from '@/lib/db/prisma';

interface ShopFilters {
  region?: string;
  subRegion?: string;
  theme?: string;
  query?: string;
  sort?: string;
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

function buildShopWhere(filters: ShopFilters): Prisma.ShopWhereInput {
  return {
    isVisible: true,
    ...(filters.region && filters.region !== 'all' ? { region: filters.region } : {}),
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
  const shops = await prisma.shop.findMany({
    where: buildShopWhere(filters),
    include: shopInclude,
    orderBy: [{ isPremium: 'desc' }, { premiumOrder: 'asc' }, { createdAt: 'desc' }],
  });

  const allShops = shops.map(mapShop);
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

  const premiumShops = sortedShops
    .filter((shop) => shop.isPremium)
    .sort((left, right) => (left.premiumOrder ?? 999) - (right.premiumOrder ?? 999));
  const regularShops = sortedShops.filter((shop) => !shop.isPremium);

  return {
    allShops: sortedShops,
    premiumShops,
    regularShops,
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
