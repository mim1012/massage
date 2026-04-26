import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDirectorySortType, sortRegularShops } from '@/lib/directory-sort';
import type { Shop } from '@/lib/types';

function makeShop(partial: Partial<Shop>): Shop {
  return {
    id: partial.id ?? 'shop',
    slug: partial.slug ?? 'shop',
    name: partial.name ?? 'Shop',
    region: partial.region ?? 'seoul',
    regionLabel: partial.regionLabel ?? '서울',
    district: partial.district,
    districtLabel: partial.districtLabel,
    theme: partial.theme ?? 'swedish',
    themeLabel: partial.themeLabel ?? '스웨디시',
    tagline: partial.tagline ?? '',
    description: partial.description ?? '',
    address: partial.address ?? '',
    contact: partial.contact ?? '',
    images: partial.images ?? [],
    tags: partial.tags ?? [],
    courses: partial.courses ?? [],
    rating: partial.rating ?? 0,
    reviewCount: partial.reviewCount ?? 0,
    isPremium: partial.isPremium ?? false,
    isVisible: partial.isVisible ?? true,
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
  } satisfies Shop;
}

test('getDirectorySortType normalizes supported sort params', () => {
  assert.equal(getDirectorySortType('popular'), 'popular');
  assert.equal(getDirectorySortType('new'), 'new');
  assert.equal(getDirectorySortType('random'), 'random');
  assert.equal(getDirectorySortType(null), 'random');
  assert.equal(getDirectorySortType('unexpected'), 'random');
});

test('sortRegularShops sorts by newest when sortType is new', () => {
  const shops = [
    makeShop({ id: 'older', createdAt: '2026-01-01T00:00:00.000Z' }),
    makeShop({ id: 'newest', createdAt: '2026-03-01T00:00:00.000Z' }),
    makeShop({ id: 'middle', createdAt: '2026-02-01T00:00:00.000Z' }),
  ];

  const sorted = sortRegularShops(shops, 'new');
  assert.deepEqual(sorted.map((shop) => shop.id), ['newest', 'middle', 'older']);
});

test('sortRegularShops sorts by review count then rating for popular mode', () => {
  const shops = [
    makeShop({ id: 'rating-wins', reviewCount: 10, rating: 5, createdAt: '2026-01-01T00:00:00.000Z' }),
    makeShop({ id: 'newer-tiebreak', reviewCount: 10, rating: 5, createdAt: '2026-02-01T00:00:00.000Z' }),
    makeShop({ id: 'more-reviews', reviewCount: 20, rating: 1, createdAt: '2026-01-01T00:00:00.000Z' }),
  ];

  const sorted = sortRegularShops(shops, 'popular');
  assert.deepEqual(sorted.map((shop) => shop.id), ['more-reviews', 'newer-tiebreak', 'rating-wins']);
});
