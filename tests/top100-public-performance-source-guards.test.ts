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
