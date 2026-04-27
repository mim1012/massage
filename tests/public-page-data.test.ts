import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildHomePageData,
  buildTop100PageData,
  mapReviewsWithRegion,
  type ReviewWithRegion,
} from '@/lib/public-page-data';
import type { HomeSeoContent, Review, Shop, SiteSettings } from '@/lib/types';

function makeShop(partial: Partial<Shop>): Shop {
  return {
    id: partial.id ?? 'shop',
    slug: partial.slug ?? 'shop',
    name: partial.name ?? 'Shop',
    region: partial.region ?? 'seoul',
    regionLabel: partial.regionLabel ?? '서울',
    subRegion: partial.subRegion,
    subRegionLabel: partial.subRegionLabel,
    theme: partial.theme ?? 'swedish',
    themeLabel: partial.themeLabel ?? '스웨디시',
    isPremium: partial.isPremium ?? false,
    premiumOrder: partial.premiumOrder,
    thumbnailUrl: partial.thumbnailUrl ?? '/thumb.jpg',
    bannerUrl: partial.bannerUrl ?? '/banner.jpg',
    images: partial.images ?? [],
    tagline: partial.tagline ?? '',
    description: partial.description ?? '',
    address: partial.address ?? '',
    phone: partial.phone ?? '',
    hours: partial.hours ?? '',
    rating: partial.rating ?? 0,
    reviewCount: partial.reviewCount ?? 0,
    courses: partial.courses ?? [],
    tags: partial.tags ?? [],
    isVisible: partial.isVisible ?? true,
    ownerId: partial.ownerId,
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? '2026-01-01T00:00:00.000Z',
  };
}

function makeReview(partial: Partial<Review>): Review {
  return {
    id: partial.id ?? 'review',
    shopId: partial.shopId ?? 'shop',
    shopName: partial.shopName ?? 'Shop',
    authorName: partial.authorName ?? 'Author',
    rating: partial.rating ?? 5,
    content: partial.content ?? 'content',
    isHidden: partial.isHidden,
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
  };
}

const fallbackSiteSettings: SiteSettings = {
  siteName: '힐링찾기',
  siteTitle: '전국 제휴업소 디렉토리',
  siteDescription: 'HEALING DIRECTORY',
  heroMainText: '메인',
  heroSubText: '서브',
  contactPhone: '1588-0000',
  footerInfo: 'footer',
};

const fallbackHomeSeo: HomeSeoContent = {
  section1Title: 's1',
  section1Content: 'c1',
  section2Title: 's2',
  section2Content: 'c2',
  section3Title: 's3',
  section3Content: 'c3',
};

test('buildHomePageData keeps site content and sorts regular shops by requested sort', () => {
  const older = makeShop({ id: 'older', createdAt: '2026-01-01T00:00:00.000Z' });
  const newer = makeShop({ id: 'newer', createdAt: '2026-03-01T00:00:00.000Z' });
  const premium = makeShop({ id: 'premium', isPremium: true, premiumOrder: 5 });

  const result = buildHomePageData({
    shopResponse: {
      allShops: [premium, newer, older],
      premiumShops: [premium],
      regularShops: [older, newer],
      total: 3,
    },
    sortType: 'new',
    siteContent: {
      siteSettings: fallbackSiteSettings,
      homeSeo: fallbackHomeSeo,
    },
  });

  assert.deepEqual(result.regularShops.map((shop) => shop.id), ['newer', 'older']);
  assert.deepEqual(result.premiumShops.map((shop) => shop.id), ['premium']);
  assert.equal(result.siteSettings.siteName, '힐링찾기');
  assert.equal(result.homeSeo.section1Title, 's1');
});

test('buildTop100PageData ranks by review count, rating, then recency', () => {
  const ranked = buildTop100PageData({
    allShops: [
      makeShop({ id: 'newer-tie', reviewCount: 10, rating: 5, createdAt: '2026-03-01T00:00:00.000Z' }),
      makeShop({ id: 'older-tie', reviewCount: 10, rating: 5, createdAt: '2026-02-01T00:00:00.000Z' }),
      makeShop({ id: 'most-reviewed', reviewCount: 20, rating: 1, createdAt: '2026-01-01T00:00:00.000Z' }),
    ],
    premiumShops: [],
    regularShops: [],
    total: 3,
  });

  assert.deepEqual(ranked.map((shop) => shop.id), ['most-reviewed', 'newer-tie', 'older-tie']);
});

test('mapReviewsWithRegion decorates reviews using shop metadata', () => {
  const shops = [
    makeShop({ id: 'shop-a', region: 'seoul', regionLabel: '서울' }),
    makeShop({ id: 'shop-b', region: 'busan', regionLabel: '부산' }),
  ];

  const reviews = mapReviewsWithRegion(
    [makeReview({ id: 'a', shopId: 'shop-a' }), makeReview({ id: 'unknown', shopId: 'missing' })],
    shops,
  );

  assert.deepEqual((reviews[0] as ReviewWithRegion).regionLabel, '서울');
  assert.deepEqual((reviews[0] as ReviewWithRegion).region, 'seoul');
  assert.deepEqual((reviews[1] as ReviewWithRegion).regionLabel, '');
  assert.deepEqual((reviews[1] as ReviewWithRegion).region, '');
});
