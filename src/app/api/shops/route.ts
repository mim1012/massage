import type { NextRequest } from 'next/server';
import { buildDirectorySearchParams, getDirectoryCanonicalRedirect, parseDirectoryQuery } from '@/lib/directory-mode';
import { listDirectoryShops } from '@/lib/server/shop-store';

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

  return Response.json(
    await listDirectoryShops({
      region: directorySearchParams.get('region') ?? undefined,
      subRegion: directorySearchParams.get('subRegion') ?? undefined,
      theme: directorySearchParams.get('theme') ?? undefined,
      query: directorySearchParams.get('q') ?? undefined,
      sort: directorySearchParams.get('sort') ?? undefined,
      regularOffset: Number.isFinite(regularOffset) ? regularOffset : undefined,
      regularLimit: Number.isFinite(regularLimit) && regularLimit > 0 ? regularLimit : undefined,
      includePremium: regularOffset === 0,
    }),
  );
}
