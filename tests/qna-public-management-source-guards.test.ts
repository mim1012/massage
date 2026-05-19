import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, '..');

async function readProjectFile(relativePath: string) {
  return fs.readFile(path.join(projectRoot, relativePath), 'utf8');
}

test('public qna route keeps scoped edit/delete guards instead of generic admin mutations', async () => {
  const source = await readProjectFile('src/app/api/board/qna/[id]/route.ts');

  assert.match(source, /import\s*\{\s*deletePublicQna,\s*updatePublicQna\s*\}\s*from\s*'@\/lib\/server\/communityStore'/);
  assert.match(source, /const updated = await updatePublicQna\(id, user\.id, \{ question: body\.question\.trim\(\) \}, \{ id: user\.id, role: user\.role \}\)/);
  assert.match(source, /const deleted = await deletePublicQna\(id, user\.id\)/);
  assert.doesNotMatch(source, /updateQna\(/);
  assert.doesNotMatch(source, /deleteQna\(/);
  assert.match(source, /existing\.userId !== user\.id/);
  assert.match(source, /existing\.status !== QnaStatus\.OPEN/);
  assert.match(source, /existing\._count\.comments > 0/);
  assert.match(source, /질문 상태가 변경되어 수정할 수 없습니다/);
  assert.match(source, /질문 상태가 변경되어 삭제할 수 없습니다/);
});

test('communityStore keeps canManage derived field for public qna instead of exposing raw userId', async () => {
  const source = await readProjectFile('src/lib/server/communityStore.ts');
  const typeSource = await readProjectFile('src/lib/types.ts');

  assert.match(source, /function canManagePublicQna\(/);
  assert.match(source, /viewer\.role !== 'USER' \|\| viewer\.id !== entry\.userId/);
  assert.match(source, /return entry\.status === QnaStatus\.OPEN && commentCount === 0/);
  assert.match(source, /canManage: canManagePublicQna\(entry, viewer, comments\.length\)/);
  assert.match(source, /canManage: canManagePublicQna\(entry, viewer, commentCount\)/);
  assert.doesNotMatch(source, /userId: entry\.userId \?\? undefined/);
  assert.match(typeSource, /export interface QnA \{[\s\S]*canManage\?: boolean;[\s\S]*comments: QnAComment\[];[\s\S]*\}/);
  assert.doesNotMatch(typeSource, /export interface QnA \{[\s\S]*userId\?: string;/);
});

test('public qna page and client keep server-derived pagination and canManage wiring', async () => {
  const pageSource = await readProjectFile('src/app/board/qna/page.tsx');
  const clientSource = await readProjectFile('src/components/public/QnaPageClient.tsx');

  assert.match(pageSource, /const page = normalizePageParam\(pickFirst\(resolvedSearchParams\?\.page\)\)/);
  assert.match(pageSource, /const viewer = await getSessionUser\(\)/);
  assert.match(pageSource, /const entryPage = await listPublicQnaPage\(\{[\s\S]*page,[\s\S]*shopId,[\s\S]*search,[\s\S]*viewer: viewer \? \{ id: viewer\.id, role: viewer\.role \} : undefined,[\s\S]*\}\)/);
  assert.match(pageSource, /initialPage=\{entryPage\.page\}/);
  assert.match(pageSource, /initialTotalPages=\{entryPage\.totalPages\}/);

  assert.match(clientSource, /Boolean\(entry\.canManage\)/);
  assert.doesNotMatch(clientSource, /user && \(user\.id === entry\.userId \|\| user\.role === 'ADMIN'\)/);
  assert.match(clientSource, /PaginationControls/);
});
