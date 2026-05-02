import { Suspense } from 'react';
import HomePageClient from '@/components/public/HomePageClient';
import { redirect } from 'next/navigation';
import { MOCK_HOME_SEO, MOCK_SITE_SETTINGS } from '@/lib/mockData';
import { buildHomePageData } from '@/lib/public-page-data';
import { buildBrowseHref } from '@/lib/directory-mode';
import { deriveStructuredSearchIntent } from '@/lib/structured-search';
import { getDirectorySortType } from '@/lib/directory-sort';
import { createDeferredHomeShopResponse, shouldDeferInitialHomeDirectoryFetch } from '@/lib/home-directory-fetch-strategy';
import { getPublicSiteContent } from '@/lib/server/communityStore';
import { listShops } from '@/lib/server/shop-store';

const HOME_REGULAR_PAGE_SIZE = 24;

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
  const region = pickFirst(resolvedSearchParams?.region);
  const subRegion = pickFirst(resolvedSearchParams?.subRegion);
  const theme = pickFirst(resolvedSearchParams?.theme);
  const q = pickFirst(resolvedSearchParams?.q);
  const sort = pickFirst(resolvedSearchParams?.sort);
  const canonicalSearchIntent = !region && !subRegion && !theme ? deriveStructuredSearchIntent(q) : {};

  if (q?.trim() && !canonicalSearchIntent.freeText && (canonicalSearchIntent.region || canonicalSearchIntent.subRegion || canonicalSearchIntent.theme)) {
    redirect(
      buildBrowseHref({
        basePath: '/',
        region: canonicalSearchIntent.region,
        subRegion: canonicalSearchIntent.subRegion,
        theme: canonicalSearchIntent.theme,
        sort,
      }),
    );
  }

  const sortType = getDirectorySortType(sort);
  const deferInitialDirectoryFetch = shouldDeferInitialHomeDirectoryFetch({ query: q });

  const [shopResponse, siteContent] = await Promise.all([
    deferInitialDirectoryFetch
      ? Promise.resolve(createDeferredHomeShopResponse())
      : listShops({
          region,
          subRegion,
          theme,
          query: q,
          sort,
          regularOffset: 0,
          regularLimit: HOME_REGULAR_PAGE_SIZE,
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
        initialRegularTotal={initialData.regularTotal}
        initialSiteSettings={initialData.siteSettings}
        initialHomeSeo={initialData.homeSeo}
        deferInitialDirectoryFetch={deferInitialDirectoryFetch}
      />
    </Suspense>
  );
}
