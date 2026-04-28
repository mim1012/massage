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

test('home page exposes mobile-only promo banner fallbacks for sidebar ads', async () => {
  const source = await readProjectFile('src/components/public/HomePageClient.tsx');

  assert.equal(source.includes('md:hidden'), true);
  assert.equal(source.includes('건마에반하다'), true);
  assert.equal(source.includes('입점 문의'), true);
  assert.equal(source.includes('배너 슬롯'), true);
});
