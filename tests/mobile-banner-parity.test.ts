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

test('home page server composition keeps canonical directory + deferred data flow intact', async () => {
  const homePageSource = await readProjectFile('src/app/page.tsx');

  assert.equal(homePageSource.includes("import HomePageClient from '@/components/public/HomePageClient';"), true);
  assert.equal(homePageSource.includes("import { getPublicSiteContent } from '@/lib/server/communityStore';"), true);
  assert.equal(homePageSource.includes("import { listDirectoryShops } from '@/lib/server/shop-store';"), true);
  assert.equal(homePageSource.includes('createDeferredHomeShopResponse'), true);
  assert.equal(homePageSource.includes('shouldDeferInitialHomeDirectoryFetch'), true);
  assert.equal(homePageSource.includes('getDirectoryCanonicalRedirect'), true);
  assert.equal(homePageSource.includes('<HomePageClient'), true);
});

test('top100 page server composition keeps canonical redirect + data loading intact', async () => {
  const top100PageSource = await readProjectFile('src/app/top100/page.tsx');

  assert.equal(top100PageSource.includes("import Top100PageClient from '@/components/public/Top100PageClient';"), true);
  assert.equal(top100PageSource.includes('listTopShops'), true);
  assert.equal(top100PageSource.includes('getDirectoryCanonicalRedirect'), true);
  assert.equal(top100PageSource.includes('parseDirectoryQuery'), true);
  assert.equal(top100PageSource.includes('<Top100PageClient initialShops={shops} />'), true);
});

test('home client keeps mobile region chips before premium cards and mobile banner rail after the list', async () => {
  const prodSource = await readProjectFile('src/components/public/HomePageClient.tsx');

  assert.equal(prodSource.includes("import Sidebar from '@/components/Sidebar';"), true);
  assert.equal(prodSource.includes("import MobileBannerRail from '@/components/public/MobileBannerRail';"), true);
  assert.equal(prodSource.includes('scrollbar-hide md:hidden'), true);
  assert.equal(prodSource.indexOf('scrollbar-hide md:hidden') < prodSource.indexOf('{premiumShops.length > 0 && ('), true);
  assert.equal(prodSource.indexOf('{premiumShops.length > 0 && (') < prodSource.indexOf('<MobileBannerRail />'), true);
  assert.equal(prodSource.indexOf('<MobileBannerRail />') < prodSource.indexOf('seo-content mt-6 rounded-lg border border-gray-200 bg-white p-5'), true);
  assert.equal(prodSource.includes("📋 ${sortType === 'popular' ? '인기 추천 업소' : '전체 업소'}"), true);
  assert.equal(prodSource.includes('지역이나 테마를 바꿔 다른 업소를 찾아보세요.'), false);
});

test('desktop promo placement stays delegated to Sidebar instead of inline home-page banners', async () => {
  const prodSource = await readProjectFile('src/components/public/HomePageClient.tsx');
  const sidebarSource = await readProjectFile('src/components/Sidebar.tsx');

  assert.equal(prodSource.includes("import SidebarPromoBanners from '@/components/public/SidebarPromoBanners';"), false);
  assert.equal(prodSource.includes('<SidebarPromoBanners mode="inline" />'), false);
  assert.equal(sidebarSource.includes("import SidebarPromoBanners from '@/components/public/SidebarPromoBanners';"), true);
  assert.equal(sidebarSource.includes('<SidebarPromoBanners mode="sidebar" />'), true);
  assert.equal(sidebarSource.includes('hidden md:block w-[180px] shrink-0'), true);
});
test('sidebar theme links clear region scope so expanded district menus collapse after click', async () => {
  const sidebarSource = await readProjectFile('src/components/Sidebar.tsx');

  assert.equal(sidebarSource.includes("href={buildBrowseHref({ mode: 'theme', basePath: baseUrl })}"), true);
  assert.equal(sidebarSource.includes("href={buildBrowseHref({ mode: 'theme', basePath: baseUrl, theme: t.code })}"), true);
  assert.equal(sidebarSource.includes("href={buildBrowseHref({ mode: 'theme', basePath: baseUrl, region: currentRegion"), false);
  assert.equal(sidebarSource.includes("href={buildBrowseHref({ mode: 'theme', basePath: baseUrl, theme: t.code, region: currentRegion"), false);
});

test('prod no longer ships the extra mobile promo banner component that the template never had', async () => {
  await assert.rejects(() => fs.access(path.join(projectRoot, 'src/components/public/MobilePromoBanners.tsx')), /ENOENT/);
});
