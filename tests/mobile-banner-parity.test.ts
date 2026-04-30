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

test('home page matches template by not rendering shared mobile promo banners', async () => {
  const source = await readProjectFile('src/components/public/HomePageClient.tsx');

  assert.equal(source.includes("import MobilePromoBanners from '@/components/public/MobilePromoBanners';"), false);
  assert.equal(source.includes('<MobilePromoBanners />'), false);
});

test('top100 page matches template by not rendering shared mobile promo banners', async () => {
  const source = await readProjectFile('src/components/public/Top100PageClient.tsx');

  assert.equal(source.includes("import MobilePromoBanners from '@/components/public/MobilePromoBanners';"), false);
  assert.equal(source.includes('<MobilePromoBanners />'), false);
});

test('template sidebar keeps ad guide, partnership, and banner slot in desktop sidebar only', async () => {
  const source = await readProjectFile('src/components/Sidebar.tsx');

  assert.equal(source.includes('광고 안내'), true);
  assert.equal(source.includes('입점 문의'), true);
  assert.equal(source.includes('배너 슬롯'), true);
  assert.equal(source.includes('hidden md:block'), true);
});
