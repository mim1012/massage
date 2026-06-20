import type { NextRequest } from 'next/server';
import { buildDirectorySearchParams, getDirectoryCanonicalRedirect, parseDirectoryQuery } from '@/lib/directory-mode';
import { listTopShops } from '@/lib/server/shop-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const directoryQuery = parseDirectoryQuery(searchParams);
  const canonicalRedirect = getDirectoryCanonicalRedirect({
    ...directoryQuery,
    basePath: request.nextUrl.pathname,
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

  return Response.json(
    await listTopShops({
      region: directorySearchParams.get('region') ?? undefined,
      subRegion: directorySearchParams.get('subRegion') ?? undefined,
      theme: directorySearchParams.get('theme') ?? undefined,
      query: directorySearchParams.get('q') ?? undefined,
    }),
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
  );
}
