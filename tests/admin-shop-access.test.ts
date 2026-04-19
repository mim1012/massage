import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeShopInputForSave } from '@/lib/server/admin-shop-access';
import type { Shop } from '@/lib/types';

function buildShop(overrides: Partial<Shop> = {}): Shop {
  return {
    id: 'shop-test',
    name: 'Test Shop',
    slug: 'test-shop',
    region: 'seoul',
    regionLabel: 'Seoul',
    subRegion: 'gangnam',
    subRegionLabel: 'Gangnam',
    theme: 'swedish',
    themeLabel: 'Swedish',
    isPremium: true,
    premiumOrder: 3,
    thumbnailUrl: '/thumb.jpg',
    bannerUrl: '/banner.jpg',
    images: ['/thumb.jpg'],
    tagline: 'Tagline',
    description: 'Description',
    address: '123 Test Road',
    phone: '010-0000-0000',
    hours: '10:00 - 22:00',
    rating: 4.5,
    reviewCount: 0,
    courses: [],
    tags: ['test'],
    isVisible: true,
    ownerId: 'owner-source',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

test('normalizeShopInputForSave preserves admin payloads', () => {
  const shop = buildShop();
  const normalized = normalizeShopInputForSave({ id: 'admin-1', role: 'ADMIN' }, shop);

  assert.deepEqual(normalized, shop);
});

test('normalizeShopInputForSave constrains owner-created shops', () => {
  const shop = buildShop({
    ownerId: 'other-owner',
    isPremium: true,
    premiumOrder: 99,
    isVisible: true,
  });

  const normalized = normalizeShopInputForSave({ id: 'owner-1', role: 'OWNER' }, shop);

  assert.equal(normalized.ownerId, 'owner-1');
  assert.equal(normalized.isPremium, false);
  assert.equal(normalized.premiumOrder, undefined);
  assert.equal(normalized.isVisible, false);
});

test('normalizeShopInputForSave preserves immutable admin-only fields on owner updates', () => {
  const incoming = buildShop({
    ownerId: 'other-owner',
    isPremium: true,
    premiumOrder: 50,
    isVisible: false,
  });

  const existing = buildShop({
    ownerId: 'owner-1',
    isPremium: false,
    premiumOrder: undefined,
    isVisible: true,
  });

  const normalized = normalizeShopInputForSave({ id: 'owner-1', role: 'OWNER' }, incoming, existing);

  assert.equal(normalized.ownerId, 'owner-1');
  assert.equal(normalized.isPremium, false);
  assert.equal(normalized.premiumOrder, undefined);
  assert.equal(normalized.isVisible, true);
});
