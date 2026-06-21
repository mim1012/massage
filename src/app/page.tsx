import { Suspense } from 'react';
import { after } from 'next/server';
import HomeSeoSection from '@/components/public/HomeSeoSection';
import HomePageClient from '@/components/public/HomePageClient';
import { redirect } from 'next/navigation';
import { MOCK_HOME_SEO, MOCK_SITE_SETTINGS } from '@/lib/mockData';
import { buildHomePageData } from '@/lib/public-page-data';
import { getDirectoryCanonicalRedirect, parseDirectoryQuery } from '@/lib/directory-mode';
import { getDirectorySortType } from '@/lib/directory-sort';
import { createDeferredHomeShopResponse, shouldDeferInitialHomeDirectoryFetch } from '@/lib/home-directory-fetch-strategy';
import { normalizePageParam } from '@/lib/pagination';
import { getPublicSiteContent } from '@/lib/server/communityStore';
import { listDirectoryShops, warmPublicShopDetailCaches } from '@/lib/server/shop-store';

const HOME_REGULAR_PAGE_SIZE = 30;
export const preferredRegion = 'sin1';

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<{
    view?: SearchParamValue;
    region?: SearchParamValue;
    subRegion?: SearchParamValue;
    theme?: SearchParamValue;
    q?: SearchParamValue;
    sort?: SearchParamValue;
    page?: SearchParamValue;
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
  const page = normalizePageParam(pickFirst(resolvedSearchParams?.page));
  const canonicalRedirect = getDirectoryCanonicalRedirect({
    ...directoryQuery,
    basePath: '/',
    extraParams: {
      page: page > 1 ? page : undefined,
    },
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
          regularOffset: (page - 1) * HOME_REGULAR_PAGE_SIZE,
          regularLimit: HOME_REGULAR_PAGE_SIZE,
          includePremium: page === 1,
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
        deferInitialDirectoryFetch={deferInitialDirectoryFetch}
      >
        <HomeSeoSection homeSeo={initialData.homeSeo} />
      </HomePageClient>
    </Suspense>
  );
}
