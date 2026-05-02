import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Top100PageClient from '@/components/public/Top100PageClient';
import { buildTop100PageData } from '@/lib/public-page-data';
import { buildBrowseHref } from '@/lib/directory-mode';
import { deriveStructuredSearchIntent } from '@/lib/structured-search';
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
  const region = pickFirst(resolvedSearchParams?.region);
  const subRegion = pickFirst(resolvedSearchParams?.subRegion);
  const theme = pickFirst(resolvedSearchParams?.theme);
  const q = pickFirst(resolvedSearchParams?.q);
  const canonicalSearchIntent = !region && !subRegion && !theme ? deriveStructuredSearchIntent(q) : {};

  if (q?.trim() && !canonicalSearchIntent.freeText && (canonicalSearchIntent.region || canonicalSearchIntent.subRegion || canonicalSearchIntent.theme)) {
    redirect(
      buildBrowseHref({
        basePath: '/top100',
        region: canonicalSearchIntent.region,
        subRegion: canonicalSearchIntent.subRegion,
        theme: canonicalSearchIntent.theme,
      }),
    );
  }

  const shopResponse = await listShops({
    region,
    subRegion,
    theme,
    query: q,
  });

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <Top100PageClient initialShops={buildTop100PageData(shopResponse)} />
    </Suspense>
  );
}
