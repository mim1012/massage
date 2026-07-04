import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

async function readProjectFile(path: string) {
  return await readFile(path, 'utf8');
}

test('admin qna uses cached managed data and defers shop options until needed', async () => {
  const adminPageSource = await readProjectFile('src/app/admin/qna/page.tsx');
  const adminRouteSource = await readProjectFile('src/app/api/admin/qna/route.ts');
  const adminReviewRouteSource = await readProjectFile('src/app/api/admin/reviews/route.ts');
  const adminShopRouteSource = await readProjectFile('src/app/api/admin/shops/route.ts');
  const qnaPageSource = await readProjectFile('src/components/admin/QnaManagementPage.tsx');
  const communityStoreSource = await readProjectFile('src/lib/server/communityStore.ts');
  const shopStoreSource = await readProjectFile('src/lib/server/shop-store.ts');

  assert.equal(adminPageSource.includes('loadShopsOnDemand'), true);
  assert.equal(adminPageSource.includes('listManagedShops(user)'), false);
  assert.equal(adminRouteSource.includes("url.searchParams.get('page')"), true);
  assert.equal(adminRouteSource.includes("url.searchParams.get('pageSize')"), true);
  assert.equal(adminRouteSource.includes("'Cache-Control': ADMIN_PRIVATE_CACHE_CONTROL"), true);
  assert.equal(adminReviewRouteSource.includes("'Cache-Control': ADMIN_PRIVATE_CACHE_CONTROL"), true);
  assert.equal(adminReviewRouteSource.includes('page: Number.isInteger(page) && page > 0 ? page : undefined'), true);
  assert.equal(adminShopRouteSource.includes("'Cache-Control': ADMIN_PRIVATE_CACHE_CONTROL"), true);
  assert.equal(qnaPageSource.includes("fetch('/api/admin/shops?view=options'"), true);
  assert.equal(qnaPageSource.includes('loadShopsOnDemand'), true);
  assert.equal(communityStoreSource.includes("const MANAGED_SHOPS_CACHE_TAG = 'managed-shops';"), true);
  assert.equal(communityStoreSource.includes("const MANAGED_QNA_CACHE_TAG = 'managed-qna';"), true);
  assert.equal(communityStoreSource.includes('const getCachedManagedShops = unstable_cache('), true);
  assert.equal(communityStoreSource.includes('const getCachedManagedShopOptions = unstable_cache('), true);
  assert.equal(communityStoreSource.includes('const getCachedManagedQna = unstable_cache('), true);
  assert.equal(shopStoreSource.includes("revalidateTag('managed-shops', 'max');"), true);
  assert.equal(shopStoreSource.includes("revalidateTag('managed-qna', 'max');"), true);
  assert.equal(communityStoreSource.includes('export async function listManagedShopOptions('), true);
  assert.equal(adminShopRouteSource.includes("searchParams.get('view')"), true);
});
