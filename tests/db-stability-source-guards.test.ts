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

test('db stability hot paths keep conservative Supabase pooling and retry wrappers', async () => {
  const prismaConfigSource = await readProjectFile('src/lib/db/prisma.ts');
  const adminStatsSource = await readProjectFile('src/lib/server/admin-stats.ts');
  const themeStoreSource = await readProjectFile('src/lib/server/theme-store.ts');
  const shopStoreSource = await readProjectFile('src/lib/server/shop-store.ts');
  const communityStoreSource = await readProjectFile('src/lib/server/communityStore.ts');
  const boardQnaRouteSource = await readProjectFile('src/app/api/board/qna/route.ts');
  const boardReviewRouteSource = await readProjectFile('src/app/api/board/reviews/route.ts');
  const analyticsRouteSource = await readProjectFile('src/app/api/analytics/page-view/route.ts');

  assert.equal(prismaConfigSource.includes('if (isSupabaseHost(url.hostname)) {'), true);
  assert.equal(prismaConfigSource.includes('return DEFAULT_SUPABASE_POOL_MAX;'), true);
  assert.equal(prismaConfigSource.includes('const DEFAULT_SUPABASE_IDLE_TIMEOUT_MS = 1_000;'), true);
  assert.equal(prismaConfigSource.includes('const DEFAULT_SUPABASE_MAX_LIFETIME_SECONDS = 15;'), true);
  assert.equal(prismaConfigSource.includes('return isSupabase ? Math.min(configured, DEFAULT_SUPABASE_MAX_LIFETIME_SECONDS) : configured;'), true);
  assert.equal(prismaConfigSource.includes('idleTimeoutMillis: supabaseHost ? DEFAULT_SUPABASE_IDLE_TIMEOUT_MS : DEFAULT_POOL_IDLE_TIMEOUT_MS,'), true);
  assert.equal(prismaConfigSource.includes("pool.on('error'"), true);
  assert.equal(adminStatsSource.includes('withDatabaseRetry(() => prisma.pageViewEvent.count())'), true);
  assert.equal(themeStoreSource.includes('withDatabaseRetry(() => prisma.theme.findMany'), true);
  assert.equal(shopStoreSource.includes('const shop = await withDatabaseRetry(() =>'), true);
  assert.equal(shopStoreSource.includes('const reviews = await withDatabaseRetry(() =>'), true);
  assert.equal(communityStoreSource.includes('const [notices, qna, reviews] = await withDatabaseRetry(() =>'), true);
  assert.equal(communityStoreSource.includes("const getCachedNotices = unstable_cache(loadNotices, [PUBLIC_BOARD_CACHE_TAG, 'notices']"), true);
  assert.equal(communityStoreSource.includes("safeRevalidateTag(PUBLIC_BOARD_CACHE_TAG);"), true);
  assert.equal(communityStoreSource.includes('const updated = await withDatabaseRetry(() =>'), true);
  assert.equal(communityStoreSource.includes('await withDatabaseRetry(() => prisma.qnA.delete({ where: { id } }))'), true);
  assert.equal(communityStoreSource.includes('const record = await withDatabaseRetry(() =>'), true);
  assert.equal(boardQnaRouteSource.includes('const shop = await withDatabaseRetry(() =>'), true);
  assert.equal(boardReviewRouteSource.includes('const shop = await withDatabaseRetry(() =>'), true);
  assert.equal(analyticsRouteSource.includes('await withDatabaseRetry(() =>'), true);
  assert.equal(prismaConfigSource.includes("console.error('[db] unexpected pg pool error:'"), true);
  assert.equal(/await prisma\./.test(communityStoreSource), false);
  assert.equal(/const pending = prisma\./.test(communityStoreSource), false);
});
