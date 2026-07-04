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
  // 갤러리 이미지는 고정 비율 컨테이너(aspect-[4/3]) 안에서 지연 로딩된다.
  assert.match(source, /aspect-\[4\/3\]"[\s\S]*loading="lazy"[\s\S]*fetchPriority="low"/);
});

test('public shop images reserve layout space while keeping containment classes', async () => {
  const shopCardSource = await readProjectFile('src/components/ShopCard.tsx');
  const homeClientSource = await readProjectFile('src/components/public/HomePageClient.tsx');
  const mediaSource = await readProjectFile('src/components/public/ShopMediaSection.tsx');

  assert.match(shopCardSource, /width=\{320\}[\s\S]*height=\{320\}[\s\S]*className="absolute inset-0 h-full w-full object-fill/);
  assert.match(homeClientSource, /width=\{480\}[\s\S]*height=\{480\}[\s\S]*className="absolute inset-0 h-full w-full bg-white object-contain/);
  // 상세 대표 이미지는 aspect-[16/9] 컨테이너가 공간을 예약하고, 로드 완료 시 페이드 인한다.
  assert.match(mediaSource, /aspect-\[16\/9\]"[\s\S]*fetchPriority="high"[\s\S]*onLoad=\{\(\) => setPrimaryImageLoaded\(true\)\}/);
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
