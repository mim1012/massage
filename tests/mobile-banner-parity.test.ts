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

test('home page server composition keeps a static default shell while client bootstraps filtered URLs on demand', async () => {
  const homePageSource = await readProjectFile('src/app/page.tsx');
  const homeClientSource = await readProjectFile('src/components/public/HomePageClient.tsx');
  const appLayoutSource = await readProjectFile('src/app/layout.tsx');
  const globalLayoutSource = await readProjectFile('src/components/GlobalLayout.tsx');
  const siteContentSource = await readProjectFile('src/lib/use-site-content.tsx');
  const homeSeoSectionSource = await readProjectFile('src/components/public/HomeSeoSection.tsx');

  assert.equal(homePageSource.includes("import HomePageClient from '@/components/public/HomePageClient';"), true);
  assert.equal(homePageSource.includes("import HomeSeoSection from '@/components/public/HomeSeoSection';"), true);
  assert.equal(homePageSource.includes("import { getPublicSiteContent } from '@/lib/server/communityStore';"), true);
  assert.equal(homePageSource.includes("import { listDirectoryShops, warmPublicShopDetailCaches } from '@/lib/server/shop-store';"), true);
  assert.equal(homePageSource.includes('createDeferredHomeShopResponse'), false);
  assert.equal(homePageSource.includes('shouldDeferInitialHomeDirectoryFetch'), false);
  assert.equal(homePageSource.includes('getDirectoryCanonicalRedirect'), false);
  assert.equal(homePageSource.includes('searchParams'), false);
  assert.equal(homePageSource.includes('export const revalidate = 120;'), true);
  assert.equal(homePageSource.includes("export const preferredRegion = 'sin1'"), true);
  assert.equal(homePageSource.includes('deferInitialDirectoryFetch={false}'), true);
  assert.equal(homePageSource.includes('<HomePageClient'), true);
  assert.equal(homePageSource.includes('<HomeSeoSection homeSeo={initialData.homeSeo} />'), true);
  assert.equal(homeClientSource.includes('const bootstrappedFromUrl = useRef(false);'), true);
  assert.equal(homeClientSource.includes('const shouldHydrateFromUrl ='), true);
  assert.equal(homeClientSource.includes('searchParams.get("view") === "theme"'), true);
  assert.equal(homeClientSource.includes('void loadShops(initialPage, new URLSearchParams(window.location.search));'), true);
  assert.equal(appLayoutSource.includes("import { getPublicSiteContent } from '@/lib/server/communityStore';"), true);
  assert.equal(appLayoutSource.includes('<GlobalLayout initialSiteContent={initialSiteContent}>'), true);
  assert.equal(globalLayoutSource.includes('<SiteContentProvider initialContent={initialSiteContent}>'), true);
  assert.equal(siteContentSource.includes("fetch('/api/site-settings'"), false);
  assert.equal(homeSeoSectionSource.includes("contentVisibility: 'auto'"), true);
  assert.equal(homeSeoSectionSource.includes("containIntrinsicSize: '720px'"), true);
});

test('home page and directory api both schedule limited post-response detail cache warmups for visible cards', async () => {
  const homePageSource = await readProjectFile('src/app/page.tsx');
  const shopsApiSource = await readProjectFile('src/app/api/shops/route.ts');
  const shopStoreSource = await readProjectFile('src/lib/server/shop-store.ts');

  assert.equal(homePageSource.includes("import { after } from 'next/server';"), true);
  assert.equal(homePageSource.includes('after(async () => {'), true);
  assert.equal(homePageSource.includes('warmPublicShopDetailCaches(detailWarmupSlugs);'), true);
  assert.equal(shopsApiSource.includes("import { after } from 'next/server';"), true);
  assert.equal(shopsApiSource.includes('warmPublicShopDetailCaches(detailWarmupSlugs);'), true);
  assert.equal(shopStoreSource.includes('export async function warmPublicShopDetailCaches(slugs: string[]) {'), true);
})


test('top100 page server composition keeps canonical redirect + data loading intact', async () => {
  const top100PageSource = await readProjectFile('src/app/top100/page.tsx');

  assert.equal(top100PageSource.includes("import Top100PageClient from '@/components/public/Top100PageClient';"), true);
  assert.equal(top100PageSource.includes('listTopShops'), true);
  assert.equal(top100PageSource.includes('getDirectoryCanonicalRedirect'), true);
  assert.equal(top100PageSource.includes('parseDirectoryQuery'), true);
  assert.equal(top100PageSource.includes('<Top100PageClient initialShops={shops} />'), true);
});

test('home client keeps mobile region chips before premium cards and mobile banner rail before the deferred seo section slot', async () => {
  const prodSource = await readProjectFile('src/components/public/HomePageClient.tsx');

  assert.equal(prodSource.includes('import Sidebar from "@/components/Sidebar";'), true);
  assert.equal(prodSource.includes('import MobileBannerRail from "@/components/public/MobileBannerRail";'), true);
  assert.equal(prodSource.includes('scrollbar-hide md:hidden'), true);
  assert.equal(prodSource.indexOf('scrollbar-hide md:hidden') < prodSource.indexOf('{premiumShops.length > 0 && ('), true);
  assert.equal(prodSource.indexOf('{premiumShops.length > 0 && (') < prodSource.indexOf('<MobileBannerRail />'), true);
  assert.equal(prodSource.indexOf('<MobileBannerRail />') < prodSource.indexOf('{children}'), true);
  assert.equal(prodSource.includes('initialHomeSeo'), false);
  assert.equal(prodSource.includes('children?: ReactNode;'), true);
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
  assert.equal(homeClientSource.includes('requestIdleCallback'), true);
  assert.equal(homeClientSource.includes('hasLoadedDirectory'), true);
  assert.equal(homeClientSource.includes('connection?.saveData'), true);
  assert.equal(homeClientSource.includes('selectedRegion === "all" && selectedSubRegion === "all" && selectedTheme === "all"'), true);
  assert.equal(homeClientSource.includes('PREWARM_REGION_CODES'), false);
  assert.equal(homeClientSource.includes('PREWARM_THEME_CODES'), false);
  assert.equal(homeClientSource.includes('Visible navigation still loads on demand.'), true);
});

test('smart prefetch links hand home directory clicks to the smooth client transition path', async () => {
  const smartLinkSource = await readProjectFile('src/components/SmartPrefetchLink.tsx');

  assert.equal(smartLinkSource.includes("new CustomEvent('public-directory:navigate'"), true);
  assert.equal(smartLinkSource.includes("window.location.pathname === '/' && targetUrl.pathname === '/'"), true);
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

test('mobile header menu exposes region to district navigation and the same top-level browse categories as desktop', async () => {
  const headerSource = await readProjectFile('src/components/Header.tsx');

  assert.equal(headerSource.includes("const mobileRegionNavigatorCode = selectedRegion !== 'all' ? selectedRegion : currentRegion ?? 'all';"), true);
  assert.equal(headerSource.includes('지역 선택 후 구·군까지 바로 이동'), true);
  assert.equal(headerSource.includes("mode: 'region'"), true);
  assert.equal(headerSource.includes('mobileDistricts.map((district) => ('), true);
  assert.equal(headerSource.includes('const mobilePrimaryLinks = ['), true);
  assert.equal(headerSource.includes("label: '지역별업소'"), true);
  assert.equal(headerSource.includes("label: '테마별업소'"), true);
  assert.equal(headerSource.includes("label: '인기순위'"), true);
  assert.equal(headerSource.includes("label: '커뮤니티'"), true);
  assert.equal(headerSource.includes("label: '광고안내'"), true);
  assert.equal(headerSource.includes("label: '고객센터'"), true);
})
test('shop cards prefetch detail pages on direct user intent while limiting automatic home prefetching to lead cards', async () => {
  const shopCardSource = await readProjectFile('src/components/ShopCard.tsx');
  const homeClientSource = await readProjectFile('src/components/public/HomePageClient.tsx');

  assert.equal(shopCardSource.includes('useRouter'), true);
  assert.equal(shopCardSource.includes('router.prefetch(detailHref)'), true);
  assert.equal(shopCardSource.includes("prefetchStrategy?: 'intent' | 'lead';"), true);
  assert.equal(shopCardSource.includes("if (prefetchStrategy !== 'lead')"), true);
  assert.equal(shopCardSource.includes('prefetch={false}'), true);
  assert.equal(shopCardSource.includes('scroll'), true);
  assert.equal(homeClientSource.includes('premium-shop-card flex overflow-hidden'), true);
  assert.equal(homeClientSource.includes('const warmPremiumDetailAssets = useCallback('), true);
  assert.equal(homeClientSource.includes('prefetch={false}'), true);
  assert.equal(homeClientSource.includes('scroll'), true);
  assert.equal(homeClientSource.includes('prefetchStrategy={index < 2 ? "lead" : "intent"}'), true);
  assert.equal(homeClientSource.includes('onMouseEnter={() => warmPremiumDetailAssets(detailHref, detailHeroUrl)}'), true);
  assert.equal(homeClientSource.includes('href={detailHref}'), true);
  assert.equal(shopCardSource.includes('new window.Image()'), true);
  assert.equal(shopCardSource.includes("detailImage.decoding = 'async'"), true);
  assert.equal(shopCardSource.includes('IntersectionObserver'), true);
  assert.equal(shopCardSource.includes('requestIdleCallback'), true);
  assert.equal(shopCardSource.includes('onMouseEnter={warmDetailAssets}'), true);
  assert.equal(shopCardSource.includes('onTouchStart={warmDetailAssets}'), true);
  assert.equal(shopCardSource.includes('onPointerDown={warmDetailAssets}'), true);
});

test('shop detail routes stay near the production database with a loading shell, cached public detail reads, deferred review hydration, and a hard scroll reset', async () => {
  const shopPageSource = await readProjectFile('src/app/shop/[slug]/page.tsx');
  const shopApiSource = await readProjectFile('src/app/api/shops/[slug]/route.ts');
  const shopLoadingSource = await readProjectFile('src/app/shop/[slug]/loading.tsx');
  const shopStoreSource = await readProjectFile('src/lib/server/shop-store.ts');
  const scrollResetSource = await readProjectFile('src/components/public/ScrollToTopOnMount.tsx');

  assert.equal(shopPageSource.includes("export const preferredRegion = 'sin1'"), true);
  assert.equal(shopApiSource.includes("export const preferredRegion = 'sin1'"), true);
  assert.equal(shopPageSource.includes("export const dynamic = 'force-dynamic';"), false);
  assert.equal(shopPageSource.includes("import ScrollToTopOnMount from '@/components/public/ScrollToTopOnMount';"), true);
  assert.equal(shopPageSource.includes('<ScrollToTopOnMount />'), true);
  assert.equal(scrollResetSource.includes('useLayoutEffect'), true);
  assert.equal(scrollResetSource.includes("behavior: 'auto'"), true);
  assert.equal(shopPageSource.includes("import ShopMediaSection from '@/components/public/ShopMediaSection';"), true);
  assert.equal(shopApiSource.includes('getShopReviewsBySlug'), true);
  assert.equal(shopLoadingSource.includes('animate-pulse'), true);
  assert.equal(shopLoadingSource.includes('grid grid-cols-1 gap-3 lg:grid-cols-[1fr_280px]'), true);
  assert.equal(shopStoreSource.includes("const PUBLIC_SHOP_DETAIL_CACHE_TAG = 'public-shop-detail';"), true);
  assert.equal(shopStoreSource.includes('const getPersistentShopDetail = unstable_cache('), true);
  assert.equal(shopStoreSource.includes('const getPersistentShopMetadata = unstable_cache('), true);
  assert.equal(shopStoreSource.includes('invalidatePublicShopDetailCache();'), true);
})

test('shop editors do not expose manual slug input and admin route reuses the shared editor', async () => {
  const sharedEditorSource = await readProjectFile('src/components/admin/ShopEditorPage.tsx');
  const adminEditorSource = await readProjectFile('src/app/admin/shops/[id]/page.tsx');

  assert.equal(sharedEditorSource.includes('슬러그 (URL 영문)'), false);
  assert.equal(sharedEditorSource.includes('value={form.slug}'), false);
  assert.equal(sharedEditorSource.includes('저장 시 업소명 기준으로 상세 페이지 주소가 자동 생성됩니다.'), true);
  assert.equal(adminEditorSource.includes("import ShopEditorPage from '@/components/admin/ShopEditorPage';"), true);
  assert.equal(adminEditorSource.includes('routeBase="/admin/shops"'), true);
});

test('shop editor course rows keep stable keys while typing', async () => {
  const sharedEditorSource = await readProjectFile('src/components/admin/ShopEditorPage.tsx');

  assert.equal(sharedEditorSource.includes("key={`${course.name}-${index}`}"), false);
  assert.equal(sharedEditorSource.includes("key={`course-${"), true);
  assert.equal(sharedEditorSource.includes('current.map((course, courseIndex)'), true);
});
test('shop card thumbnails preserve full scraped images without backdrop artifacts', async () => {
  const shopCardSource = await readProjectFile('src/components/ShopCard.tsx');
  const homeClientSource = await readProjectFile('src/components/public/HomePageClient.tsx');

  assert.equal(shopCardSource.includes('const showThumbnail = Boolean(thumbnailUrl) && !imageFailed;'), true);
  assert.equal(shopCardSource.includes('scale-110 object-cover opacity-25 blur-sm'), false);
  assert.equal(shopCardSource.includes('object-contain transition-opacity'), true);
  assert.equal(shopCardSource.includes('fetchPriority="low"'), true);
  assert.equal(shopCardSource.includes("onError={() => setImageFailed(true)}"), true);
  assert.equal(homeClientSource.includes('const premiumThumbnailUrl = withShopMediaVariant(shop.thumbnailUrl, \'premium-card\');'), true);
  assert.equal(homeClientSource.includes('loading={index === 0 ? "eager" : "lazy"}'), true);
  assert.equal(homeClientSource.includes('decoding="async"'), true);
  assert.equal(homeClientSource.includes('fetchPriority={index === 0 ? "high" : "low"}'), true);
  assert.equal(homeClientSource.includes('{themeEmoji[shop.theme] ?? "✨"}'), true);
});

test('shop detail media preserves full scraped images while deferring heavier gallery work, using sized proxy variants, and keeping description blocks inside the mobile viewport', async () => {
  const shopPageSource = await readProjectFile('src/app/shop/[slug]/page.tsx');
  const shopStoreSource = await readProjectFile('src/lib/server/shop-store.ts');
  const mediaSource = await readProjectFile('src/components/public/ShopMediaSection.tsx');
  const bannerRouteSource = await readProjectFile('src/app/api/shops/[slug]/banner/route.ts');
  const galleryRouteSource = await readProjectFile('src/app/api/shops/[slug]/images/[index]/route.ts');

  assert.equal(shopPageSource.includes('<ShopMediaSection shopName={shop.name} primaryImage={primaryImage} galleryImages={shop.images} />'), true);
  assert.equal(shopStoreSource.includes("buildShopBannerProxyUrl(record.slug, record.updatedAt, 'hero')"), true);
  assert.equal(shopStoreSource.includes("buildShopGalleryImageProxyUrl(record.slug, record.updatedAt, index, 'gallery')"), true);
  assert.equal(shopStoreSource.includes("buildShopGalleryImageProxyUrl(record.slug, record.updatedAt, 0, 'hero')"), true);
  assert.equal(mediaSource.includes('loading="eager"'), true);
  assert.equal(mediaSource.includes('fetchPriority="high"'), true);
  assert.equal(mediaSource.includes('loading="lazy"'), true);
  assert.equal(mediaSource.includes('추가 사진 {dedupedGalleryImages.length}장 불러오기'), true);
  assert.equal(mediaSource.includes('사진 {remainingImageCount}장 더 보기'), true);
  assert.equal(bannerRouteSource.includes("searchParams.get('size')"), true);
  assert.equal(galleryRouteSource.includes('Number.parseInt(index, 10)'), true);
  assert.equal(galleryRouteSource.includes("searchParams.get('size')"), true);
  assert.equal(mediaSource.includes('scale-110 object-cover opacity-25 blur-sm'), false);
  assert.equal(shopPageSource.includes('[overflow-wrap:anywhere]'), true);
  assert.equal(shopPageSource.includes('[&_a]:break-all'), true);
})

test('list view keeps a fixed thumbnail box instead of collapsing images', async () => {
  const globalCssSource = await readProjectFile('src/app/globals.css');

  assert.equal(globalCssSource.includes('height: 120px;'), true);
  assert.equal(globalCssSource.includes('.list-view .shop-card-img { width: 100px; height: 100px; min-height: 100px; }'), true);
});

test('directory category menus collapse after a concrete region or theme choice', async () => {
  const sidebarSource = await readProjectFile('src/components/Sidebar.tsx');
  const headerSource = await readProjectFile('src/components/Header.tsx');

  assert.equal(sidebarSource.includes('currentRegion === r.code && !currentSubRegion && DISTRICTS[r.code]'), true);
  assert.equal(headerSource.includes("directoryMode === 'theme' && currentRegion && (!currentTheme || currentTheme === 'all')"), true);
});

test('top-level navigation links prefetch on intent for faster page changes', async () => {
  const headerSource = await readProjectFile('src/components/Header.tsx');
  const smartLinkSource = await readProjectFile('src/components/SmartPrefetchLink.tsx');
  const themesSource = await readProjectFile('src/lib/use-themes.ts');
  const authSessionSource = await readProjectFile('src/lib/use-auth-session.ts');

  assert.equal(headerSource.includes('<SmartPrefetchLink href="/top100"'), true);
  assert.equal(headerSource.includes('<SmartPrefetchLink href="/board"'), true);
  assert.equal(headerSource.includes('<SmartPrefetchLink href="/ad"'), true);
  assert.equal(headerSource.includes('<SmartPrefetchLink href="/board/qna"'), true);
  assert.equal(smartLinkSource.includes('router.push(targetHref, { scroll: true });'), true);
  assert.equal(headerSource.includes('useAuthSession()'), true);
  assert.equal(headerSource.includes('router.prefetch(href)'), false);
  assert.equal(themesSource.includes('requestIdleCallback'), true);
  assert.equal(themesSource.includes("fetch('/api/themes', { cache: 'force-cache' })"), true);
  assert.equal(authSessionSource.includes('window.requestIdleCallback'), true);
});
test('shop image uploads are resized before persisting previews', async () => {
  const resizeSource = await readProjectFile('src/lib/client/image-resize.ts');
  const sharedEditorSource = await readProjectFile('src/components/admin/ShopEditorPage.tsx');
  const adminEditorSource = await readProjectFile('src/app/admin/shops/[id]/page.tsx');

  assert.equal(resizeSource.includes('canvas.width = width'), true);
  assert.equal(resizeSource.includes("mode === 'cover'"), true);
  assert.equal(sharedEditorSource.includes('readThumbnailFileAsDataUrl'), true);
  assert.equal(sharedEditorSource.includes("width: 800, height: 800, mode: 'cover'"), true);
  assert.equal(adminEditorSource.includes('routeBase="/admin/shops"'), true);
});

test('shop editor preview card mirrors the actual list thumbnail fallback instead of drifting to banner-only state', async () => {
  const sharedEditorSource = await readProjectFile('src/components/admin/ShopEditorPage.tsx');
  const adminEditorSource = await readProjectFile('src/app/admin/shops/[id]/page.tsx');

  assert.equal(sharedEditorSource.includes("const effectiveCardThumbnailPreview = thumbPreview || galleryPreviews[0] || '';"), true);
  assert.equal(sharedEditorSource.includes('setThumbPreview(shopResult.shop.thumbnailUrl);'), true);
  assert.equal(sharedEditorSource.includes('setThumbPreview(shopResult.shop.thumbnailUrl || shopResult.shop.bannerUrl);'), false);
  assert.equal(sharedEditorSource.includes('src={effectiveCardThumbnailPreview}'), true);
  assert.equal(adminEditorSource.includes('routeBase="/admin/shops"'), true);
});

test('shared shop editor waits for authenticated user data before initializing owner forms', async () => {
  const sharedEditorSource = await readProjectFile('src/components/admin/ShopEditorPage.tsx');
  const adminEditorSource = await readProjectFile('src/app/admin/shops/[id]/page.tsx');

  assert.equal(sharedEditorSource.includes("const nextUser = meResult.user ?? DEFAULT_ADMIN;"), false);
  assert.equal(sharedEditorSource.includes("if (!meResponse.ok) {"), true);
  assert.equal(sharedEditorSource.includes("if (!meResult.user) {"), true);
  assert.equal(sharedEditorSource.includes("const nextUser = meResult.user;"), true);
  assert.equal(sharedEditorSource.includes("인증 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."), true);
  assert.equal(adminEditorSource.includes('routeBase="/admin/shops"'), true);
});

test('home route avoids global smooth-scroll drift and external font blocking on first paint', async () => {
  const appLayoutSource = await readProjectFile('src/app/layout.tsx');
  const globalCssSource = await readProjectFile('src/app/globals.css');
  const smartLinkSource = await readProjectFile('src/components/SmartPrefetchLink.tsx');
  const homeClientSource = await readProjectFile('src/components/public/HomePageClient.tsx');

  assert.equal(appLayoutSource.includes('cdn.jsdelivr.net/gh/orioncactus/pretendard'), false);
  assert.equal(globalCssSource.includes('html { scroll-behavior: auto; }'), true);
  assert.equal(globalCssSource.includes('html { scroll-behavior: smooth; }'), false);
  assert.equal(smartLinkSource.includes('router.push(targetHref, { scroll: true });'), true);
  assert.equal(homeClientSource.includes('window.scrollTo({ top: 0, behavior: "auto" });'), true);
});
test('admin settings keeps dad live preview component wired', async () => {
  const settingsSource = await readProjectFile('src/app/admin/settings/page.tsx');
  const previewSource = await readProjectFile('src/app/admin/settings/_components/SettingsPreview.tsx');

  assert.equal(settingsSource.includes("import { SettingsPreview }"), true);
  assert.equal(settingsSource.includes('<SettingsPreview siteForm={siteForm} seoForm={seoForm} />'), true);
  assert.equal(previewSource.includes('export function SettingsPreview'), true);
});
test('admin seo editor caps footer copy length and stores the limit in one shared place', async () => {
  const settingsSource = await readProjectFile('src/app/admin/settings/page.tsx');
  const settingsRouteSource = await readProjectFile('src/app/api/admin/settings/route.ts');
  const siteContentLimitsSource = await readProjectFile('src/lib/site-content-limits.ts');

  assert.equal(siteContentLimitsSource.includes('export const HOME_SEO_CONTENT_MAX_LENGTH = 4000;'), true);
  assert.equal(settingsSource.includes('maxLength={HOME_SEO_CONTENT_MAX_LENGTH}'), true);
  assert.equal(settingsSource.includes('{section.content.length}/{HOME_SEO_CONTENT_MAX_LENGTH}'), true);
  assert.equal(settingsRouteSource.includes('sanitizeSiteContentPayload'), true);
  assert.equal(settingsRouteSource.includes('sanitizeBoundedText(body.section1Content, HOME_SEO_CONTENT_MAX_LENGTH)'), true);
});
test('public list APIs send CDN cache headers for smooth repeated navigation', async () => {
  const shopRouteSource = await readProjectFile('src/app/api/shops/route.ts');
  const themeRouteSource = await readProjectFile('src/app/api/themes/route.ts');
  const shopStoreSource = await readProjectFile('src/lib/server/shop-store.ts');

  assert.equal(shopRouteSource.includes('public, s-maxage=10, stale-while-revalidate=10'), true);
  assert.equal(themeRouteSource.includes('public, s-maxage=300, stale-while-revalidate=600'), true);
  assert.equal(shopRouteSource.includes("'Cache-Control': cacheControl"), true);
  assert.equal(themeRouteSource.includes("'Cache-Control': PUBLIC_THEMES_CACHE_CONTROL"), true);
  assert.equal(shopStoreSource.includes('return await getPersistentDirectoryShopList(cacheKey);'), true);
  assert.equal(shopStoreSource.includes('return listDirectoryShopsUncached({'), true);
  assert.equal(shopRouteSource.includes("export const preferredRegion = 'sin1'"), true);
  assert.equal(themeRouteSource.includes("export const preferredRegion = 'sin1'"), true);
});
test('shop list and detail payloads proxy heavy shop images through cached, size-aware media routes', async () => {
  const shopStoreSource = await readProjectFile('src/lib/server/shop-store.ts');
  const mediaHelperSource = await readProjectFile('src/lib/server/shop-media.ts');
  const thumbnailRouteSource = await readProjectFile('src/app/api/shops/[slug]/thumbnail/route.ts');
  const bannerRouteSource = await readProjectFile('src/app/api/shops/[slug]/banner/route.ts');
  const galleryRouteSource = await readProjectFile('src/app/api/shops/[slug]/images/[index]/route.ts');
  const homeClientSource = await readProjectFile('src/components/public/HomePageClient.tsx');
  const shopCardSource = await readProjectFile('src/components/ShopCard.tsx');

  assert.equal(shopStoreSource.includes('buildShopThumbnailProxyUrl'), true);
  assert.equal(shopStoreSource.includes('&size=${size}'), true);
  assert.equal(shopStoreSource.includes("buildShopThumbnailProxyUrl(record.slug, record.updatedAt, 'card')"), true);
  assert.equal(shopStoreSource.includes("buildShopBannerProxyUrl(record.slug, record.updatedAt, 'hero')"), true);
  assert.equal(shopStoreSource.includes('export async function getShopThumbnailBySlug'), true);
  assert.equal(shopStoreSource.includes('export async function getShopBannerBySlug'), true);
  assert.equal(shopStoreSource.includes('export async function getShopGalleryImageBySlug'), true);
  assert.equal(mediaHelperSource.includes("import sharp from 'sharp';"), true);
  assert.equal(mediaHelperSource.includes("'premium-card': { width: 480, height: 480, quality: 68 }"), true);
  assert.equal(mediaHelperSource.includes("return value && value in SHOP_MEDIA_VARIANTS ? (value as ShopMediaVariant) : 'card';"), true);
  assert.equal(mediaHelperSource.includes("new URL(source, request.url)"), true);
  assert.equal(mediaHelperSource.includes("image/avif,image/webp,image/*,*/*;q=0.8"), true);
  assert.equal(thumbnailRouteSource.includes("searchParams.get('size')"), true);
  assert.equal(bannerRouteSource.includes("searchParams.get('size')"), true);
  assert.equal(galleryRouteSource.includes("searchParams.get('size')"), true);
  assert.equal(homeClientSource.includes('const premiumThumbnailUrl = withShopMediaVariant(shop.thumbnailUrl, \'premium-card\');'), true);
  assert.equal(homeClientSource.includes('const leadPremiumHeroImage = premiumShops[0]?.detailImageUrl?.trim() || premiumShops[0]?.bannerUrl?.trim() || (premiumShops[0] ? withShopMediaVariant(premiumShops[0].thumbnailUrl, \'hero\') : \'\');'), true);
  assert.equal(homeClientSource.includes('fetchPriority="high" />'), true);
  assert.equal(homeClientSource.includes("const detailHeroUrl = shop.detailImageUrl?.trim() || shop.bannerUrl?.trim() || withShopMediaVariant(shop.thumbnailUrl, 'hero');"), true);
  assert.equal(homeClientSource.includes('premiumShops.slice(0, 2).map((shop) => ({'), true);
  assert.equal(homeClientSource.includes('warmPremiumDetailAssets(leadPremium.detailHref, leadPremium.detailHeroUrl);'), true);
  assert.equal(homeClientSource.includes('warmPremiumDetailAssets(detailHref, detailHeroUrl);'), true);
  assert.equal(shopCardSource.includes("const detailImageUrl = shop.detailImageUrl?.trim() || shop.bannerUrl?.trim() || thumbnailUrl;"), true);
  assert.equal(shopCardSource.includes('detailImage.fetchPriority = \'high\';'), true);
  assert.equal(shopCardSource.includes('warmDetailAssets();'), true);
})
test('directory cache prewarm cron covers common public list routes', async () => {
  const vercelConfig = await readProjectFile('vercel.json');
  const prewarmRoute = await readProjectFile('src/app/api/cron/prewarm-directory/route.ts');

  assert.equal(vercelConfig.includes('/api/cron/prewarm-directory'), true);
  assert.equal(vercelConfig.includes('0 0 * * *'), true);
  assert.equal(prewarmRoute.includes('/api/shops?region=seoul&regularOffset=0&regularLimit=30'), true);
  assert.equal(prewarmRoute.includes('/api/shops?view=theme&theme=swedish&regularOffset=0&regularLimit=30'), true);
  assert.equal(prewarmRoute.includes('/api/themes'), true);
  assert.equal(prewarmRoute.includes("export const preferredRegion = 'sin1'"), true);
});
test('prod no longer ships the extra mobile promo banner component that the template never had', async () => {
  await assert.rejects(() => fs.access(path.join(projectRoot, 'src/components/public/MobilePromoBanners.tsx')), /ENOENT/);
});
