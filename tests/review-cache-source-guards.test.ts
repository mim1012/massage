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

test('review mutations keep rating refresh and both public cache invalidations', async () => {
  const source = await readProjectFile('src/lib/server/communityStore.ts');

  assert.match(
    source,
    /export async function createReview\([\s\S]*?await refreshShopReviewRating\(input\.shopId\);[\s\S]*?invalidatePublicShopListCache\(\);[\s\S]*?invalidatePublicBoardCaches\(\);/,
  );

  assert.match(
    source,
    /export async function updateReview\([\s\S]*?if \(input\.rating !== undefined\) \{[\s\S]*?await refreshShopReviewRating\(updated\.shopId\);[\s\S]*?\}[\s\S]*?invalidatePublicShopListCache\(\);[\s\S]*?invalidatePublicBoardCaches\(\);/,
  );

  assert.match(
    source,
    /export async function deleteReview\([\s\S]*?await prisma\.review\.delete\(\{ where: \{ id: reviewId \} \}\);[\s\S]*?await refreshShopReviewRating\(review\.shopId\);[\s\S]*?invalidatePublicShopListCache\(\);[\s\S]*?invalidatePublicBoardCaches\(\);/,
  );
});

test('shop cache invalidation keeps top-shop cache clearing and Next cache context guard', async () => {
  const source = await readProjectFile('src/lib/server/shop-store.ts');

  assert.match(source, /const publicTopShopListCache = new Map<string, Promise<ShopListItem\[\]>>\(\);/);
  assert.match(source, /export function invalidatePublicShopListCache\([\s\S]*?publicTopShopListCache\.clear\(\);/);
  assert.match(source, /function isMissingNextCacheContextError\(error: unknown\)/);
  assert.match(source, /error\.message\.includes\('static generation store missing'\) \|\| error\.message\.includes\('incrementalCache missing'\)/);
  assert.match(source, /revalidateTag\(PUBLIC_DIRECTORY_SHOPS_CACHE_TAG, 'max'\);/);
});
