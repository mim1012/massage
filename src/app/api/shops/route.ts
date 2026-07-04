import type { NextRequest } from 'next/server';
import { after } from 'next/server';
import { buildDirectorySearchParams, getDirectoryCanonicalRedirect, parseDirectoryQuery } from '@/lib/directory-mode';
import { listDirectoryShops, warmPublicShopDetailCaches } from '@/lib/server/shop-store';

const PUBLIC_DIRECTORY_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';
const PUBLIC_DIRECTORY_VERCEL_CDN_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';
const MAX_PUBLIC_REGULAR_LIMIT = 60;

function parsePublicRegularOffset(value: string | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function parsePublicRegularLimit(value: string | null) {
  const parsed = Number(value ?? MAX_PUBLIC_REGULAR_LIMIT);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return MAX_PUBLIC_REGULAR_LIMIT;
  }

  return Math.min(Math.floor(parsed), MAX_PUBLIC_REGULAR_LIMIT);
}

export const preferredRegion = 'sin1';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const directoryQuery = parseDirectoryQuery(searchParams);
  const regularOffset = parsePublicRegularOffset(searchParams.get('regularOffset'));
  const regularLimit = parsePublicRegularLimit(searchParams.get('regularLimit'));
  const canonicalRedirect = getDirectoryCanonicalRedirect({
    ...directoryQuery,
    basePath: request.nextUrl.pathname,
    extraParams: {
      regularOffset: searchParams.get('regularOffset'),
      regularLimit: searchParams.get('regularLimit'),
    },
  });

  if (canonicalRedirect) {
    return Response.redirect(`${request.nextUrl.origin}${canonicalRedirect}`, 307);
  }

  const directorySearchParams = buildDirectorySearchParams({
    mode: directoryQuery.mode,
    region: directoryQuery.region,
    subRegion: directoryQuery.subRegion,
    theme: directoryQuery.theme,
    q: directoryQuery.q,
    sort: directoryQuery.sort,
  });

  const data = await listDirectoryShops({
    region: directorySearchParams.get('region') ?? undefined,
    subRegion: directorySearchParams.get('subRegion') ?? undefined,
    theme: directorySearchParams.get('theme') ?? undefined,
    query: directorySearchParams.get('q') ?? undefined,
    sort: directorySearchParams.get('sort') ?? undefined,
    regularOffset,
    regularLimit,
    includePremium: regularOffset === 0,
  });

  const detailWarmupSlugs = [
    ...data.premiumShops.slice(0, 1).map((shop) => shop.slug),
    ...data.regularShops.slice(0, 2).map((shop) => shop.slug),
  ];

  if (detailWarmupSlugs.length > 0) {
    after(async () => {
      await warmPublicShopDetailCaches(detailWarmupSlugs);
    });
  }

  const cacheControl = PUBLIC_DIRECTORY_CACHE_CONTROL;

  return Response.json(data, {
    headers: {
      'Cache-Control': cacheControl,
      'Vercel-CDN-Cache-Control': PUBLIC_DIRECTORY_VERCEL_CDN_CACHE_CONTROL,
    },
  });
}
