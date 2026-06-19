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

const REQUIRED_SEED_IMAGE_NUMBERS = Array.from({ length: 50 }, (_, index) => index + 2);

test('home page server composition keeps canonical directory + deferred data flow intact', async () => {
  const homePageSource = await readProjectFile('src/app/page.tsx');

  assert.equal(homePageSource.includes("import HomePageClient from '@/components/public/HomePageClient';"), true);
  assert.equal(homePageSource.includes("import { getPublicSiteContent } from '@/lib/server/communityStore';"), true);
  assert.equal(homePageSource.includes("import { listDirectoryShops } from '@/lib/server/shop-store';"), true);
  assert.equal(homePageSource.includes('createDeferredHomeShopResponse'), true);
  assert.equal(homePageSource.includes('shouldDeferInitialHomeDirectoryFetch'), true);
  assert.equal(homePageSource.includes('getDirectoryCanonicalRedirect'), true);
  assert.equal(homePageSource.includes("export const preferredRegion = 'sin1'"), true);
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

  assert.equal(prodSource.includes('import Sidebar from "@/components/Sidebar";'), true);
  assert.equal(prodSource.includes('import MobileBannerRail from "@/components/public/MobileBannerRail";'), true);
  assert.equal(prodSource.includes('scrollbar-hide md:hidden'), true);
  assert.equal(prodSource.indexOf('scrollbar-hide md:hidden') < prodSource.indexOf('{premiumShops.length > 0 && ('), true);
  assert.equal(prodSource.indexOf('{premiumShops.length > 0 && (') < prodSource.indexOf('<MobileBannerRail />'), true);
  assert.equal(prodSource.indexOf('<MobileBannerRail />') < prodSource.indexOf('seo-content mt-6 rounded-lg border border-gray-200 bg-white p-5'), true);
  assert.equal(prodSource.includes('📋 ${sortType === "popular" ? "인기 추천 업소" : "전체 업소"}'), true);
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
  assert.equal(sidebarSource.includes('onDirectoryNavigate?: MouseEventHandler<HTMLAnchorElement>'), true);
  assert.equal(sidebarSource.includes('onClick={onDirectoryNavigate}'), true);
});

test('seeded shop image assets exist for every generated public sample', async () => {
  const requiredFiles = REQUIRED_SEED_IMAGE_NUMBERS.flatMap((number) => [
    `sample-${number}-thumb.jpg`,
    `sample-${number}-banner.jpg`,
    `sample-${number}-1.jpg`,
    `sample-${number}-2.jpg`,
  ]);

  await Promise.all(
    requiredFiles.map((fileName) => fs.access(path.join(projectRoot, 'public/images', fileName))),
  );
});
test('public directory performance indexes and theme cache are kept in sync', async () => {
  const schemaSource = await readProjectFile('prisma/schema.prisma');
  const migrationSource = await readProjectFile('prisma/migrations/0011_public_directory_filter_indexes/migration.sql');
  const themeStoreSource = await readProjectFile('src/lib/server/theme-store.ts');

  assert.equal(schemaSource.includes('@@index([isVisible, region, isPremium, premiumOrder, createdAt(sort: Desc)])'), true);
  assert.equal(schemaSource.includes('@@index([isVisible, region, subRegion, isPremium, premiumOrder, createdAt(sort: Desc)])'), true);
  assert.equal(schemaSource.includes('@@index([isVisible, theme, isPremium, premiumOrder, createdAt(sort: Desc)])'), true);
  assert.equal(migrationSource.includes('shops_visible_region_premium_order_idx'), true);
  assert.equal(migrationSource.includes('shops_visible_region_sub_region_premium_order_idx'), true);
  assert.equal(migrationSource.includes('shops_visible_theme_premium_order_idx'), true);
  assert.equal(themeStoreSource.includes('unstable_cache'), true);
  assert.equal(themeStoreSource.includes('revalidate: 300'), true);
  assert.equal(themeStoreSource.includes('invalidateThemeCache();'), true);
});
test('home directory navigation uses client-side data fetch for smooth theme transitions', async () => {
  const homeClientSource = await readProjectFile('src/components/public/HomePageClient.tsx');

  assert.equal(homeClientSource.includes('window.history.pushState'), true);
  assert.equal(homeClientSource.includes('shopResponseCache'), true);
  assert.equal(homeClientSource.includes('<Sidebar onDirectoryNavigate={handleDirectoryNavigate} />'), true);
  assert.equal(homeClientSource.includes('fetch(`/api/shops?${cacheKey}`)'), true);
  assert.equal(homeClientSource.includes('window.addEventListener('), true);
});
test('smart prefetch links hand home directory clicks to the smooth client transition path', async () => {
  const smartLinkSource = await readProjectFile('src/components/SmartPrefetchLink.tsx');

  assert.equal(smartLinkSource.includes("new CustomEvent('public-directory:navigate'"), true);
  assert.equal(smartLinkSource.includes("window.location.pathname !== '/'"), true);
  assert.equal(smartLinkSource.includes('event.preventDefault();'), true);
});
test('footer RSS link has a real cached feed route', async () => {
  const footerSource = await readProjectFile('src/components/Footer.tsx');
  const rssRouteSource = await readProjectFile('src/app/rss/route.ts');

  assert.equal(footerSource.includes('href="/rss"'), true);
  assert.equal(rssRouteSource.includes('application/rss+xml; charset=utf-8'), true);
  assert.equal(rssRouteSource.includes('Cache-Control'), true);
  assert.equal(rssRouteSource.includes('listDirectoryShops({ regularOffset: 0, regularLimit: 30 })'), true);
});
test('header logo always links to the main home route', async () => {
  const headerSource = await readProjectFile('src/components/Header.tsx');

  assert.equal(headerSource.includes('aria-label="메인 홈으로 이동"'), true);
  assert.equal(headerSource.includes('<SmartPrefetchLink'), true);
  assert.equal(headerSource.includes('href="/"'), true);
});
test('public list APIs send CDN cache headers for smooth repeated navigation', async () => {
  const shopRouteSource = await readProjectFile('src/app/api/shops/route.ts');
  const themeRouteSource = await readProjectFile('src/app/api/themes/route.ts');

  assert.equal(shopRouteSource.includes('public, s-maxage=30, stale-while-revalidate=120'), true);
  assert.equal(themeRouteSource.includes('public, s-maxage=300, stale-while-revalidate=600'), true);
  assert.equal(shopRouteSource.includes("'Cache-Control': PUBLIC_DIRECTORY_CACHE_CONTROL"), true);
  assert.equal(themeRouteSource.includes("'Cache-Control': PUBLIC_THEMES_CACHE_CONTROL"), true);
  assert.equal(shopRouteSource.includes("export const preferredRegion = 'sin1'"), true);
  assert.equal(themeRouteSource.includes("export const preferredRegion = 'sin1'"), true);
});
test('directory cache prewarm cron covers common public list routes', async () => {
  const vercelConfig = await readProjectFile('vercel.json');
  const prewarmRoute = await readProjectFile('src/app/api/cron/prewarm-directory/route.ts');

  assert.equal(vercelConfig.includes('/api/cron/prewarm-directory'), true);
  assert.equal(vercelConfig.includes('*/5 * * * *'), true);
  assert.equal(prewarmRoute.includes('/api/shops?region=seoul&regularOffset=0&regularLimit=30'), true);
  assert.equal(prewarmRoute.includes('/api/shops?view=theme&theme=swedish&regularOffset=0&regularLimit=30'), true);
  assert.equal(prewarmRoute.includes('/api/themes'), true);
  assert.equal(prewarmRoute.includes("export const preferredRegion = 'sin1'"), true);
});
test('prod no longer ships the extra mobile promo banner component that the template never had', async () => {
  await assert.rejects(() => fs.access(path.join(projectRoot, 'src/components/public/MobilePromoBanners.tsx')), /ENOENT/);
});
