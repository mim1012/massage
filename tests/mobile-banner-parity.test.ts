import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, '..');
const templateRoot = '/tmp/massage-template-fresh';

async function readProjectFile(root: string, relativePath: string) {
  return fs.readFile(path.join(root, relativePath), 'utf8');
}

test('home page keeps the same mobile filter-to-premium flow as the template', async () => {
  const prodSource = await readProjectFile(projectRoot, 'src/components/public/HomePageClient.tsx');
  const templateSource = await readProjectFile(templateRoot, 'src/app/page.tsx');

  assert.equal(prodSource.includes('MobilePromoBanners'), false);
  assert.equal(templateSource.includes('MobilePromoBanners'), false);
  assert.equal(prodSource.includes('scrollbar-hide md:hidden'), true);
  assert.equal(templateSource.includes('md:hidden flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-3'), true);
  assert.equal(prodSource.indexOf('scrollbar-hide md:hidden') < prodSource.indexOf('{premiumShops.length > 0 && ('), true);
  assert.equal(templateSource.indexOf('scrollbar-hide mb-3') < templateSource.indexOf('{premiumShops.length > 0 && ('), true);
  assert.equal(prodSource.includes("🏷️ {sortType === 'popular' ? '인기 추천 업소' : directoryMode === 'theme' ? '테마별 업소' : '전체 업소'}"), false);
  assert.equal(prodSource.includes("📋 {sortType === 'popular' ? '인기 추천 업소' : '전체 업소'}"), true);
  assert.equal(prodSource.includes('지역이나 테마를 바꿔 다른 업소를 찾아보세요.'), false);
  assert.equal(prodSource.includes('HomeUtilityRail mode="inline"'), true);
  assert.equal(prodSource.indexOf('rounded-lg border border-gray-200 bg-white p-3') < prodSource.indexOf('seo-content mt-6 rounded-lg border border-gray-200 bg-white p-5'), true);
});

test('top100 page keeps the same hero-to-list mobile flow as the template', async () => {
  const prodSource = await readProjectFile(projectRoot, 'src/components/public/Top100PageClient.tsx');
  const templateSource = await readProjectFile(templateRoot, 'src/app/top100/page.tsx');

  assert.equal(prodSource.includes('MobilePromoBanners'), false);
  assert.equal(templateSource.includes('MobilePromoBanners'), false);
  assert.equal(prodSource.indexOf('리뷰수와 평점을 기반으로 선정된 실시간 인기 업소입니다.') < prodSource.indexOf('rounded-lg border border-gray-200 bg-white p-3'), true);
  assert.equal(templateSource.indexOf('리뷰수와 평점을 기반으로 선정된 실시간 인기 업소입니다.') < templateSource.indexOf('bg-white border border-gray-200 rounded-lg p-3'), true);
});

test('home utility rail is reused responsively instead of a hard-coded right rail only', async () => {
  const prodSource = await readProjectFile(projectRoot, 'src/components/public/HomePageClient.tsx');
  const utilitySource = await readProjectFile(projectRoot, 'src/components/public/HomeUtilityRail.tsx');
  const promoSource = await readProjectFile(projectRoot, 'src/components/public/SidebarPromoBanners.tsx');
  const sidebarSource = await readProjectFile(projectRoot, 'src/components/Sidebar.tsx');

  assert.equal(prodSource.includes("import HomeUtilityRail from '@/components/public/HomeUtilityRail';"), true);
  assert.equal(prodSource.includes("import SidebarPromoBanners from '@/components/public/SidebarPromoBanners';"), true);
  assert.equal(prodSource.includes('<HomeUtilityRail mode="inline" directoryMode={directoryMode} />'), true);
  assert.equal(prodSource.includes('<HomeUtilityRail mode="sidebar" directoryMode={directoryMode} />'), true);
  assert.equal(prodSource.includes('<SidebarPromoBanners mode="inline" />'), true);
  assert.equal(sidebarSource.includes('<SidebarPromoBanners mode="sidebar" />'), true);
  assert.equal(prodSource.includes('hidden w-[120px] shrink-0 xl:block'), true);
  assert.equal(prodSource.includes('hidden lg:block xl:hidden'), true);
  assert.equal(utilitySource.includes("mode: 'sidebar' | 'inline'"), true);
  assert.equal(promoSource.includes("mode?: 'sidebar' | 'inline'"), true);
});

test('prod no longer ships the extra mobile promo banner component that the template never had', async () => {
  await assert.rejects(() => fs.access(path.join(projectRoot, 'src/components/public/MobilePromoBanners.tsx')), /ENOENT/);
});
