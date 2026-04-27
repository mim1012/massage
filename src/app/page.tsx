import { Suspense } from 'react';
import HomePageClient from '@/components/public/HomePageClient';
import { MOCK_HOME_SEO, MOCK_SITE_SETTINGS } from '@/lib/mockData';
import { buildHomePageData } from '@/lib/public-page-data';
import { getDirectorySortType } from '@/lib/directory-sort';
import { getPublicSiteContent } from '@/lib/server/communityStore';
import { listShops } from '@/lib/server/shop-store';

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<{
    region?: SearchParamValue;
    subRegion?: SearchParamValue;
    theme?: SearchParamValue;
    q?: SearchParamValue;
    sort?: SearchParamValue;
  }>;
};

function pickFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sortType = getDirectorySortType(pickFirst(resolvedSearchParams?.sort));

  const [shopResponse, siteContent] = await Promise.all([
    listShops({
      region: pickFirst(resolvedSearchParams?.region),
      subRegion: pickFirst(resolvedSearchParams?.subRegion),
      theme: pickFirst(resolvedSearchParams?.theme),
      query: pickFirst(resolvedSearchParams?.q),
    }),
    getPublicSiteContent(),
  ]);

  const initialData = buildHomePageData({
    shopResponse,
    sortType,
    siteContent: siteContent ?? {
      siteSettings: MOCK_SITE_SETTINGS,
      homeSeo: MOCK_HOME_SEO,
    },
  });

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <HomePageClient
        initialPremiumShops={initialData.premiumShops}
        initialRegularShops={initialData.regularShops}
        initialSiteSettings={initialData.siteSettings}
        initialHomeSeo={initialData.homeSeo}
      />
    </Suspense>
  );
}
