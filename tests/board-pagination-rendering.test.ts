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

test('board review page uses pagination controls for filtered review results', async () => {
  const source = await readProjectFile('src/components/public/ReviewPageClient.tsx');

  assert.equal(source.includes('PaginationControls'), true);
  assert.equal(source.includes('currentPage'), true);
});

test('board qna page uses pagination controls for filtered qna results', async () => {
  const source = await readProjectFile('src/components/public/QnaPageClient.tsx');

  assert.equal(source.includes('PaginationControls'), true);
  assert.equal(source.includes('currentPage'), true);
});
