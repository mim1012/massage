import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, '..');

async function read(rel: string) {
  return fs.readFile(path.join(projectRoot, rel), 'utf8');
}

test('ad banner store keeps retry-wrapped queries, slot allowlist, and tag invalidation', async () => {
  const store = await read('src/lib/server/ad-banner-store.ts');
  assert.ok(store.includes("const AD_BANNER_SLOTS: AdBannerSlotKey[] = ['detail', 'sidebar', 'mobile'];"));
  assert.ok(store.includes('withDatabaseRetry(() => prisma.adBanner.findMany'));
  assert.ok(store.includes('withDatabaseRetry(() =>'));
  assert.ok(store.includes('prisma.adBanner.upsert('));
  assert.ok(store.includes("throw new Error('INVALID_AD_SLOT');"));
  assert.ok(store.includes("revalidateTag(AD_BANNERS_CACHE_TAG, 'max');"));
  assert.ok(store.includes("const AD_BANNERS_CACHE_TAG = 'ad-banners';"));
});

test('ad banner schema and migration define the ad_banners table', async () => {
  const schema = await read('prisma/schema.prisma');
  assert.ok(schema.includes('model AdBanner {'));
  assert.ok(schema.includes('@@map("ad_banners")'));
  const migration = await read('prisma/migrations/0015_ad_banners/migration.sql');
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS "ad_banners"'));
});

test('public ad-banners route is cached and admin route is role-guarded', async () => {
  const publicRoute = await read('src/app/api/ad-banners/route.ts');
  assert.ok(publicRoute.includes('listActiveAdBanners'));
  assert.ok(publicRoute.includes('s-maxage=60'));

  const adminRoute = await read('src/app/api/admin/ad-banners/route.ts');
  assert.ok(adminRoute.includes("await requireRole('ADMIN')"));
  assert.ok(adminRoute.includes('upsertAdBanner'));
  assert.ok(adminRoute.includes('export async function PATCH'));
});

test('public AdBannerSlot fetches banners and auto-fits with object-cover', async () => {
  const slot = await read('src/components/public/AdBannerSlot.tsx');
  assert.ok(slot.includes("fetch('/api/ad-banners')"));
  assert.ok(slot.includes('object-cover'));
  // falls back to the original placeholder when no banner is set
  assert.ok(slot.includes('return <>{children}</>;'));
});

test('all three public slots mount AdBannerSlot and admin premium hosts the manager', async () => {
  const detail = await read('src/app/shop/[slug]/page.tsx');
  assert.ok(detail.includes('<AdBannerSlot slot="detail"'));
  const sidebar = await read('src/components/public/SidebarPromoBanners.tsx');
  assert.ok(sidebar.includes('<AdBannerSlot slot="sidebar"'));
  const mobile = await read('src/components/public/MobileBannerRail.tsx');
  assert.ok(mobile.includes('<AdBannerSlot slot="mobile"'));

  const premium = await read('src/app/admin/premium/page.tsx');
  assert.ok(premium.includes('<AdBannerManager />'));
  const manager = await read('src/components/admin/AdBannerManager.tsx');
  assert.ok(manager.includes("fetch('/api/admin/upload'"));
  assert.ok(manager.includes("fetch('/api/admin/ad-banners'"));
  assert.ok(manager.includes('이미지 첨부'));
});
