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

test('top100 page renders from cached server data instead of empty force-dynamic CSR fallback', async () => {
  const source = await readProjectFile('src/app/top100/page.tsx');

  assert.equal(source.includes("export const dynamic = 'force-dynamic'"), false);
  assert.match(source, /export const revalidate = 120;/);
  assert.match(source, /const shops = await listTopShops\(\{[\s\S]*?region: directorySearchParams\.get\('region'\) \?\? undefined,[\s\S]*?query: directorySearchParams\.get\('q'\) \?\? undefined,[\s\S]*?\}\);/);
  assert.equal(source.includes('const shops: Awaited<ReturnType<typeof listTopShops>> = [];'), false);
  assert.match(source, /<Top100PageClient initialShops=\{shops\} \/>/);
});

test('top100 client refresh does not force no-store on the public cached API', async () => {
  const source = await readProjectFile('src/components/public/Top100PageClient.tsx');

  assert.equal(source.includes("cache: 'no-store'"), false);
  assert.match(source, /fetch\(`\/api\/shops\/top\?\$\{params\.toString\(\)\}`\)/);
  assert.match(source, /const \[shops, setShops\] = useState<ShopListItem\[\]>\(initialShops\);/);
});

test('popular directory pagination stays at the database query level', async () => {
  const source = await readProjectFile('src/lib/server/shop-store.ts');
  const orderByFunction = source.match(/function getRegularOrderBy\(sort\?: string\): Prisma\.ShopOrderByWithRelationInput\[\] \{[\s\S]*?\n\}/)?.[0] ?? '';
  const directoryFunction = source.match(/async function listDirectoryShopsUncached\(filters: DirectoryShopFilters = \{\}\): Promise<ShopListResponse> \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.match(orderByFunction, /if \(sort === 'popular'\) \{\s*return \[\{ reviewCount: 'desc' \}, \{ rating: 'desc' \}, \{ createdAt: 'desc' \}\];\s*\}/);
  assert.equal(directoryFunction.includes("filters.sort === 'popular'"), false);
  assert.equal(directoryFunction.includes('return listShopsUncached(filters);'), false);
  assert.match(directoryFunction, /orderBy: getRegularOrderBy\(filters\.sort\),[\s\S]*?skip: regularOffset,[\s\S]*?take: regularLimit/);
  assert.match(directoryFunction, /prisma\.shop\.count\(\{ where: regularWhere \}\)/);
});

test('public shops API clamps abusive pagination before hitting the database', async () => {
  const routeSource = await readProjectFile('src/app/api/shops/route.ts');

  assert.equal(routeSource.includes('const MAX_PUBLIC_REGULAR_LIMIT = 60;'), true);
  assert.equal(routeSource.includes("parsePublicRegularOffset(searchParams.get('regularOffset'))"), true);
  assert.equal(routeSource.includes("parsePublicRegularLimit(searchParams.get('regularLimit'))"), true);
  assert.match(routeSource, /return Math\.min\(Math\.floor\(parsed\), MAX_PUBLIC_REGULAR_LIMIT\);/);
  assert.equal(routeSource.includes('includePremium: regularOffset === 0'), true);
});

test('public shops API declares a Vercel CDN cache policy for burst traffic', async () => {
  const routeSource = await readProjectFile('src/app/api/shops/route.ts');

  assert.equal(routeSource.includes("const PUBLIC_DIRECTORY_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';"), true);
  assert.equal(routeSource.includes("const PUBLIC_DIRECTORY_VERCEL_CDN_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';"), true);
  assert.equal(routeSource.includes("'Vercel-CDN-Cache-Control': PUBLIC_DIRECTORY_VERCEL_CDN_CACHE_CONTROL"), true);
});

test('public directory search shares identical in-flight database work', async () => {
  const source = await readProjectFile('src/lib/server/shop-store.ts');
  const listDirectoryFunction = source.match(/export async function listDirectoryShops\(filters: DirectoryShopFilters = \{\}\) \{[\s\S]*?\n\}/)?.[0] ?? '';

  assert.equal(source.includes("import { getSharedInFlight } from '@/lib/server/in-flight';"), true);
  assert.match(listDirectoryFunction, /const normalizedQuery = filters\.query\?\.trim\(\);/);
  assert.match(listDirectoryFunction, /const cacheKey = normalizeDirectoryShopListCacheKey\(normalizedFilters\);/);
  assert.match(listDirectoryFunction, /return getSharedInFlight\(directoryShopListInFlight, cacheKey, async \(\) => \{/);
  assert.equal(listDirectoryFunction.includes('if (normalizedQuery) {'), true);
  assert.equal(listDirectoryFunction.includes('return listDirectoryShopsUncached(normalizedFilters);'), true);
});

test('popular filtered shop queries have matching database indexes', async () => {
  const schema = await readProjectFile('prisma/schema.prisma');
  const migration = await readProjectFile('prisma/migrations/0016_public_popular_filter_indexes/migration.sql');

  for (const indexName of [
    'shops_visible_region_regular_popular_idx',
    'shops_visible_region_sub_region_regular_popular_idx',
    'shops_visible_theme_regular_popular_idx',
    'shops_visible_region_top_popular_idx',
    'shops_visible_theme_top_popular_idx',
  ]) {
    assert.equal(schema.includes(`map: "${indexName}"`), true);
    assert.equal(migration.includes(`"${indexName}"`), true);
  }
});
