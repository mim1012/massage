import { Suspense } from 'react';
import HomePageClient from '@/components/public/HomePageClient';
import { redirect } from 'next/navigation';
import { MOCK_HOME_SEO, MOCK_SITE_SETTINGS } from '@/lib/mockData';
import { buildHomePageData } from '@/lib/public-page-data';
import { getDirectoryCanonicalRedirect, parseDirectoryQuery } from '@/lib/directory-mode';
import { getDirectorySortType } from '@/lib/directory-sort';
import { createDeferredHomeShopResponse, shouldDeferInitialHomeDirectoryFetch } from '@/lib/home-directory-fetch-strategy';
import { getPublicSiteContent } from '@/lib/server/communityStore';
import { listDirectoryShops } from '@/lib/server/shop-store';

const HOME_REGULAR_PAGE_SIZE = 30;

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<{
    view?: SearchParamValue;
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
  const directoryQuery = parseDirectoryQuery({
    view: pickFirst(resolvedSearchParams?.view),
    region: pickFirst(resolvedSearchParams?.region),
    subRegion: pickFirst(resolvedSearchParams?.subRegion),
    theme: pickFirst(resolvedSearchParams?.theme),
    q: pickFirst(resolvedSearchParams?.q),
    sort: pickFirst(resolvedSearchParams?.sort),
  });
  const canonicalRedirect = getDirectoryCanonicalRedirect({
    ...directoryQuery,
    basePath: '/',
  });

  if (canonicalRedirect) {
    redirect(canonicalRedirect);
  }

  const sortType = getDirectorySortType(directoryQuery.sort);
  const deferInitialDirectoryFetch = shouldDeferInitialHomeDirectoryFetch({
    mode: directoryQuery.mode,
    region: directoryQuery.region,
    subRegion: directoryQuery.subRegion,
    theme: directoryQuery.theme,
    query: directoryQuery.q,
  });

  const [shopResponse, siteContent] = await Promise.all([
    deferInitialDirectoryFetch
      ? Promise.resolve(createDeferredHomeShopResponse())
      : listDirectoryShops({
          region: directoryQuery.region,
          subRegion: directoryQuery.subRegion,
          theme: directoryQuery.theme,
          query: directoryQuery.q,
          sort: directoryQuery.sort,
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
