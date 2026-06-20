import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Top100PageClient from '@/components/public/Top100PageClient';
import { getDirectoryCanonicalRedirect, parseDirectoryQuery } from '@/lib/directory-mode';
import { listTopShops } from '@/lib/server/shop-store';

export const dynamic = 'force-dynamic';

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

export default async function Top100Page({ searchParams }: PageProps) {
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
    basePath: '/top100',
  });

  if (canonicalRedirect) {
    redirect(canonicalRedirect);
  }

  const shops: Awaited<ReturnType<typeof listTopShops>> = [];

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <Top100PageClient initialShops={shops} />
    </Suspense>
  );
}
