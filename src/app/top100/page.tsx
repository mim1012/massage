import { Suspense } from 'react';
import Top100PageClient from '@/components/public/Top100PageClient';
import { buildTop100PageData } from '@/lib/public-page-data';
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
  const shopResponse = await listShops({
    region: pickFirst(resolvedSearchParams?.region),
    subRegion: pickFirst(resolvedSearchParams?.subRegion),
    theme: pickFirst(resolvedSearchParams?.theme),
    query: pickFirst(resolvedSearchParams?.q),
  });

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <Top100PageClient initialShops={buildTop100PageData(shopResponse)} />
    </Suspense>
  );
}
