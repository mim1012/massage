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

test('public pages use optional session lookup so transient auth db failures do not crash the route shell', async () => {
  const guardsSource = await readProjectFile('src/lib/auth/guards.ts');
  const boardPageSource = await readProjectFile('src/app/board/page.tsx');
  const qnaPageSource = await readProjectFile('src/app/board/qna/page.tsx');
  const boardQnaRouteSource = await readProjectFile('src/app/api/board/qna/route.ts');
  const boardSummaryRouteSource = await readProjectFile('src/app/api/board/summary/route.ts');
  const shopRouteSource = await readProjectFile('src/app/api/shops/[slug]/route.ts');

  assert.equal(guardsSource.includes("if (error instanceof Error && error.message === 'DATABASE_ERROR')"), true);
  assert.equal(boardPageSource.includes('getOptionalSessionUser'), true);
  assert.equal(qnaPageSource.includes('getOptionalSessionUser'), true);
  assert.equal(boardQnaRouteSource.includes('getOptionalSessionUser'), true);
  assert.equal(boardSummaryRouteSource.includes('getOptionalSessionUser'), true);
  assert.equal(shopRouteSource.includes('getOptionalSessionUser'), true);
});
