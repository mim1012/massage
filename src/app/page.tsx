import { Suspense } from 'react';
import { after } from 'next/server';
import HomeSeoSection from '@/components/public/HomeSeoSection';
import HomePageClient from '@/components/public/HomePageClient';
import { MOCK_HOME_SEO, MOCK_SITE_SETTINGS } from '@/lib/mockData';
import { buildHomePageData } from '@/lib/public-page-data';
import { getDirectorySortType } from '@/lib/directory-sort';
import { getPublicSiteContent } from '@/lib/server/communityStore';
import { listDirectoryShops, warmPublicShopDetailCaches } from '@/lib/server/shop-store';

const HOME_REGULAR_PAGE_SIZE = 30;
export const preferredRegion = 'sin1';
export const revalidate = 120;

export default async function HomePage() {
  const [shopResponse, siteContent] = await Promise.all([
    listDirectoryShops({
      regularOffset: 0,
      regularLimit: HOME_REGULAR_PAGE_SIZE,
      includePremium: true,
    }),
    getPublicSiteContent(),
  ]);

  const initialData = buildHomePageData({
    shopResponse,
    sortType: getDirectorySortType(undefined),
    siteContent: siteContent ?? {
      siteSettings: MOCK_SITE_SETTINGS,
      homeSeo: MOCK_HOME_SEO,
    },
  });

  const detailWarmupSlugs = [
    ...initialData.premiumShops.slice(0, 1).map((shop) => shop.slug),
    ...initialData.regularShops.slice(0, 2).map((shop) => shop.slug),
  ];

  if (detailWarmupSlugs.length > 0) {
    after(async () => {
      await warmPublicShopDetailCaches(detailWarmupSlugs);
    });
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <HomePageClient
        initialPremiumShops={initialData.premiumShops}
        initialRegularShops={initialData.regularShops}
        initialRegularTotal={initialData.regularTotal}
        initialSiteSettings={initialData.siteSettings}
        deferInitialDirectoryFetch={false}
      >
        <HomeSeoSection homeSeo={initialData.homeSeo} />
      </HomePageClient>
    </Suspense>
  );
}
