import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

async function readProjectFile(path: string) {
  return await readFile(path, 'utf8');
}

test('admin dashboard uses cached reads without repeating route-level auth inside the page and invalidates on board/shop mutations', async () => {
  const adminPageSource = await readProjectFile('src/app/admin/page.tsx');
  const adminRouteSource = await readProjectFile('src/app/api/admin/dashboard/route.ts');
  const communityStoreSource = await readProjectFile('src/lib/server/communityStore.ts');
  const shopStoreSource = await readProjectFile('src/lib/server/shop-store.ts');

  assert.equal(adminPageSource.includes("getCachedAdminDashboardData"), true);
  assert.equal(adminPageSource.includes("requireRole('ADMIN')"), false);
  assert.equal(adminRouteSource.includes("getCachedAdminDashboardData"), true);
  assert.equal(adminRouteSource.includes("requireRole('ADMIN')"), true);
  assert.equal(communityStoreSource.includes("const ADMIN_DASHBOARD_CACHE_TAG = 'admin-dashboard';"), true);
  assert.equal(communityStoreSource.includes("safeRevalidateTag(ADMIN_DASHBOARD_CACHE_TAG);"), true);
  assert.equal(communityStoreSource.includes("export const getCachedAdminDashboardData = unstable_cache(getAdminDashboardData"), true);
  assert.equal(shopStoreSource.includes("revalidateTag('admin-dashboard', 'max');"), true);
});
