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

test('public review detail route supports owner update and delete guards', async () => {
  const source = await readProjectFile('src/app/api/board/reviews/[id]/route.ts');

  assert.equal(source.includes('export async function PATCH'), true);
  assert.equal(source.includes('export async function DELETE'), true);
  assert.equal(source.includes("existing.userId !== user.id && user.role !== 'ADMIN'"), true);
});

test('admin review routes expose create and update handlers', async () => {
  const collectionRoute = await readProjectFile('src/app/api/admin/reviews/route.ts');
  const detailRoute = await readProjectFile('src/app/api/admin/reviews/[id]/route.ts');

  assert.equal(collectionRoute.includes('export async function POST'), true);
  assert.equal(detailRoute.includes('export async function PATCH'), true);
  assert.equal(detailRoute.includes('updateReview'), true);
});

test('public review page keeps pagination while adding self edit/delete controls', async () => {
  const source = await readProjectFile('src/components/public/ReviewPageClient.tsx');

  assert.equal(source.includes('PaginationControls'), true);
  assert.equal(source.includes('handleEditClick'), true);
  assert.equal(source.includes('handleDeleteClick'), true);
  assert.equal(source.includes("review.userId === user.id || user.role === 'ADMIN'"), true);
});
