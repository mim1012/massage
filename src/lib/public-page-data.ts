import { sortRegularShops, type DirectorySortType } from '@/lib/directory-sort';
import type { HomeSeoContent, Review, Shop, SiteSettings } from '@/lib/types';

export type ShopListResponse = {
  allShops: Shop[];
  premiumShops: Shop[];
  regularShops: Shop[];
  regularTotal?: number;
  total: number;
};

export type SiteContent = {
  siteSettings: SiteSettings;
  homeSeo: HomeSeoContent;
};

export type ReviewWithRegion = Review & {
  region: string;
  regionLabel: string;
};

function sortShopsByPopularity(shops: Shop[]) {
  return [...shops].sort((left, right) => {
    if (right.reviewCount !== left.reviewCount) {
      return right.reviewCount - left.reviewCount;
    }
    if (right.rating !== left.rating) {
      return right.rating - left.rating;
    }
    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function buildHomePageData({
  shopResponse,
  sortType,
  siteContent,
}: {
  shopResponse: ShopListResponse;
  sortType: DirectorySortType;
  siteContent: SiteContent;
}) {
  return {
    premiumShops: shopResponse.premiumShops.slice(0, 4),
    regularShops: sortRegularShops(shopResponse.regularShops, sortType),
    regularTotal: shopResponse.regularTotal ?? shopResponse.regularShops.length,
    siteSettings: siteContent.siteSettings,
    homeSeo: siteContent.homeSeo,
  };
}

export function buildTop100PageData(shopResponse: ShopListResponse) {
  return sortShopsByPopularity(shopResponse.allShops).slice(0, 100);
}

export function mapReviewsWithRegion(reviews: Review[], shops: Shop[]): ReviewWithRegion[] {
  const shopMap = new Map(shops.map((shop) => [shop.id, shop]));

  return reviews.map((review) => {
    const matchedShop = shopMap.get(review.shopId);
    return {
      ...review,
      region: matchedShop?.region ?? '',
      regionLabel: matchedShop?.regionLabel ?? '',
    };
  });
}
