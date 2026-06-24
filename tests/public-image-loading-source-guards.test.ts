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

test('shop detail gallery does not hidden-preload thumbnails before reveal', async () => {
  const source = await readProjectFile('src/components/public/ShopMediaSection.tsx');

  assert.equal(source.includes('PRELOADED_GALLERY_IMAGES'), false);
  assert.equal(source.includes('preloadedGalleryImages'), false);
  assert.equal(source.includes('aria-hidden="true" className="pointer-events-none h-0 overflow-hidden opacity-0"'), false);
  assert.equal(source.includes("loading={index === 0 ? 'eager' : 'lazy'}"), false);
  assert.match(source, /loading="lazy"[\s\S]*fetchPriority="low"[\s\S]*width=\{560\}[\s\S]*height=\{560\}/);
});

test('public shop images declare intrinsic dimensions while keeping containment classes', async () => {
  const shopCardSource = await readProjectFile('src/components/ShopCard.tsx');
  const homeClientSource = await readProjectFile('src/components/public/HomePageClient.tsx');
  const mediaSource = await readProjectFile('src/components/public/ShopMediaSection.tsx');

  assert.match(shopCardSource, /width=\{320\}[\s\S]*height=\{320\}[\s\S]*className="absolute inset-0 h-full w-full bg-white object-contain/);
  assert.match(homeClientSource, /width=\{480\}[\s\S]*height=\{480\}[\s\S]*className="absolute inset-0 h-full w-full bg-white object-contain/);
  assert.match(mediaSource, /width=\{960\}[\s\S]*height=\{960\}[\s\S]*onLoad=\{\(\) => setPrimaryImageLoaded\(true\)\}/);
});

test('home page no longer renders hidden eager hero image preload', async () => {
  const source = await readProjectFile('src/components/public/HomePageClient.tsx');

  assert.equal(source.includes('const leadPremiumHeroImage ='), false);
  assert.equal(source.includes('pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0'), false);
  assert.equal(source.includes('<img src={leadPremiumHeroImage}'), false);
  assert.equal(source.includes('const prefetchLeadPremiumRoutes = () => {'), true);
});
test('lead shop card prefetch does not imperatively preload hero images', async () => {
  const source = await readProjectFile('src/components/ShopCard.tsx');
  const leadPrefetchEffect =
    source.match(/useEffect\(\(\) => \{\s*if \(prefetchStrategy !== 'lead'\)[\s\S]*?\}, \[prefetchStrategy, prefetchDetail\]\);/)?.[0] ?? '';

  assert.match(leadPrefetchEffect, /prefetchDetail\(\)/);
  assert.equal(leadPrefetchEffect.includes('warmDetailAssets()'), false);
  assert.equal(leadPrefetchEffect.includes('new window.Image'), false);
  assert.equal(leadPrefetchEffect.includes("fetchPriority = 'high'"), false);
});
