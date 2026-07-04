import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, '..');

async function readProjectFile(relativePath: string) {
  return fs.readFile(path.join(projectRoot, relativePath), 'utf8');
}

test('shop detail page is prerender-friendly and delegates browse breadcrumbs to a client component', async () => {
  const pageSource = await readProjectFile('src/app/shop/[slug]/page.tsx');
  const breadcrumbSource = await readProjectFile('src/components/public/ShopBrowseBreadcrumbs.tsx');

  assert.equal(pageSource.includes('export const revalidate = 120;'), true);
  // 상세 페이지는 배포 시 전체 프리렌더 대신 ISR(온디맨드 + revalidate)로 동작한다.
  assert.equal(pageSource.includes('export function generateStaticParams()'), true);
  assert.equal(pageSource.includes('searchParams?: Promise'), false);
  assert.equal(pageSource.includes('currentSearchParams'), false);
  assert.equal(pageSource.includes("import ShopBrowseBreadcrumbs from '@/components/public/ShopBrowseBreadcrumbs';"), true);
  assert.equal(pageSource.includes('<ShopBrowseBreadcrumbs'), true);
  assert.equal(breadcrumbSource.includes("'use client';"), true);
  assert.equal(breadcrumbSource.includes('useSearchParams'), true);
  assert.equal(breadcrumbSource.includes('buildShopBrowseHref'), true);
  assert.equal(breadcrumbSource.includes('getShopBrowseLabel'), true);
});

test('public shop detail loaders reuse shared records and the site content loader dedupes concurrent reads', async () => {
  const shopStoreSource = await readProjectFile('src/lib/server/shop-store.ts');
  const communityStoreSource = await readProjectFile('src/lib/server/communityStore.ts');

  assert.equal(shopStoreSource.includes("import { cache } from 'react';"), true);
  assert.equal(shopStoreSource.includes('const getVisibleShopDetailRecord = cache(async (slug: string) => {'), true);
  assert.equal(shopStoreSource.includes('const getVisibleShopSlugsUncached = async () => {'), true);
  assert.equal(shopStoreSource.includes('const getPersistentVisibleShopSlugs = unstable_cache('), true);
  assert.equal(shopStoreSource.includes('export async function listVisibleShopSlugs() {'), true);
  assert.equal(shopStoreSource.includes('const getShopMetadataBySlugUncached = async (slug: string) => {'), true);
  assert.equal(shopStoreSource.includes('const shop = await getVisibleShopDetailRecord(slug);'), true);
  assert.equal(communityStoreSource.includes('let cachedPublicSiteContentPromise:'), true);
  assert.equal(communityStoreSource.includes('if (!cachedPublicSiteContentPromise) {'), true);
  assert.equal(communityStoreSource.includes('return cachedPublicSiteContentPromise;'), true);
});
