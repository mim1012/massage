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

test('board notice page reads a page search param and renders pagination controls', async () => {
  const source = await readProjectFile('src/app/board/notice/page.tsx');

  assert.equal(source.includes('searchParams'), true);
  assert.equal(source.includes('PaginationControls'), true);
});

test('board review route reads search params and delegates pagination to the server store', async () => {
  const source = await readProjectFile('src/app/board/review/page.tsx');

  assert.equal(source.includes('searchParams'), true);
  assert.equal(source.includes('page'), true);
  assert.equal(source.includes('region'), true);
  assert.equal(source.includes('searchType'), true);
  assert.equal(source.includes('listPublicReviewPage'), true);
  assert.equal(source.includes('getSessionUser'), true);
  assert.equal(source.includes("redirect('/auth/login')"), true);
});

test('board review client still renders pagination controls', async () => {
  const source = await readProjectFile('src/components/public/ReviewPageClient.tsx');

  assert.equal(source.includes('PaginationControls'), true);
  assert.equal(source.includes('currentPage'), true);
});
test('board review client preserves server pagination metadata for server-backed filters', async () => {
  const source = await readProjectFile('src/components/public/ReviewPageClient.tsx');

  assert.match(source, /shouldUseServerPagination/);
  assert.match(source, /const initialShopTab = initialShopId \|\| 'all';/);
  assert.match(source, /const initialRegionTabFromServer =/);
  assert.match(source, /const \[regionTab, setRegionTab\] = useState\(initialRegionTabFromServer\);/);
  assert.match(source, /const totalPages = usesServerPagination\s*\?\s*\(initialTotalPagesFromServer \?\? 1\)\s*:\s*getTotalPages\(filteredReviews\.length, REVIEW_PAGE_SIZE\)/);
  assert.match(source, /const totalReviewCount = usesServerPagination \? \(initialTotalItemsFromServer \?\? filteredReviews\.length\) : filteredReviews\.length;/);
  assert.match(source, /const visibleReviews = useMemo\(\s*\(\) => \(usesServerPagination \? filteredReviews : paginateItems\(filteredReviews, currentPage, REVIEW_PAGE_SIZE\)\)/);
  assert.match(source, /router\.refresh\(\);/);
});

test('board review client syncs search, region, and shop filters back to the URL for server refetch', async () => {
  const source = await readProjectFile('src/components/public/ReviewPageClient.tsx');

  assert.match(source, /nextParams\.set\('q',/);
  assert.match(source, /nextParams\.set\('region',/);
  assert.match(source, /nextParams\.set\('shopId',/);
  assert.match(source, /nextParams\.set\('searchType',/);
  assert.doesNotMatch(source, /if \(!initialShopId\) \{\s*setRegionTab\('all'\);\s*\}/);
});

test('board qna route reads search params and delegates pagination to the server store', async () => {
  const source = await readProjectFile('src/app/board/qna/page.tsx');

  assert.equal(source.includes('searchParams'), true);
  assert.equal(source.includes('page'), true);
  assert.equal(source.includes('listPublicQnaPage'), true);
});

test('board qna client still renders pagination controls', async () => {
  const source = await readProjectFile('src/components/public/QnaPageClient.tsx');

  assert.equal(source.includes('PaginationControls'), true);
  assert.equal(source.includes('currentPage'), true);
});
