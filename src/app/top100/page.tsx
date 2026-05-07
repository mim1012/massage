import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Top100PageClient from '@/components/public/Top100PageClient';
import { buildTop100PageData } from '@/lib/public-page-data';
import { getDirectoryCanonicalRedirect, parseDirectoryQuery } from '@/lib/directory-mode';
import { listShops } from '@/lib/server/shop-store';

export const dynamic = 'force-dynamic';

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<{
    region?: SearchParamValue;
    subRegion?: SearchParamValue;
    theme?: SearchParamValue;
    q?: SearchParamValue;
  }>;
};

function pickFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Top100Page({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const directoryQuery = parseDirectoryQuery({
    view: undefined,
    region: pickFirst(resolvedSearchParams?.region),
    subRegion: pickFirst(resolvedSearchParams?.subRegion),
    theme: pickFirst(resolvedSearchParams?.theme),
    q: pickFirst(resolvedSearchParams?.q),
  });
  const canonicalRedirect = getDirectoryCanonicalRedirect({
    ...directoryQuery,
    basePath: '/top100',
  });

  if (canonicalRedirect) {
    redirect(canonicalRedirect);
  }

  const shopResponse = await listShops({
    region: directoryQuery.region,
    subRegion: directoryQuery.subRegion,
    theme: directoryQuery.theme,
    query: directoryQuery.q,
  });

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <Top100PageClient initialShops={buildTop100PageData(shopResponse)} />
    </Suspense>
  );
}
