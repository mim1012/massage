import type { NextRequest } from 'next/server';
import { after } from 'next/server';
import { buildDirectorySearchParams, getDirectoryCanonicalRedirect, parseDirectoryQuery } from '@/lib/directory-mode';
import { listDirectoryShops, warmPublicShopDetailCaches } from '@/lib/server/shop-store';

const PUBLIC_DIRECTORY_CACHE_CONTROL = 'public, s-maxage=10, stale-while-revalidate=10';
export const preferredRegion = 'sin1';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const directoryQuery = parseDirectoryQuery(searchParams);
  const regularOffset = Number(searchParams.get('regularOffset') ?? 0);
  const regularLimit = Number(searchParams.get('regularLimit') ?? 0);
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
    regularOffset: Number.isFinite(regularOffset) ? regularOffset : undefined,
    regularLimit: Number.isFinite(regularLimit) && regularLimit > 0 ? regularLimit : undefined,
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

  const cacheControl = directoryQuery.q
    ? 'private, no-store'
    : PUBLIC_DIRECTORY_CACHE_CONTROL;

  return Response.json(data, {
    headers: {
      'Cache-Control': cacheControl,
    },
  });
}
