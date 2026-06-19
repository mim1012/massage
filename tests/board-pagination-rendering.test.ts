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
  assert.equal(source.includes('listPublicReviewPage'), true);
  assert.equal(source.includes('getSessionUser'), true);
  assert.equal(source.includes("redirect('/auth/login')"), true);
});

test('board review client still renders pagination controls', async () => {
  const source = await readProjectFile('src/components/public/ReviewPageClient.tsx');

  assert.equal(source.includes('PaginationControls'), true);
  assert.equal(source.includes('currentPage'), true);
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
