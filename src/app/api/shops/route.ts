import type { NextRequest } from 'next/server';
import { deriveStructuredSearchIntent } from '@/lib/structured-search';
import { listShops } from '@/lib/server/shop-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') ?? undefined;
  const searchIntent = deriveStructuredSearchIntent(query);
  const regularOffset = Number(searchParams.get('regularOffset') ?? 0);
  const regularLimit = Number(searchParams.get('regularLimit') ?? 0);

  if (query && !searchParams.get('region') && !searchParams.get('subRegion') && !searchParams.get('theme') && !searchIntent.freeText) {
    const redirectParams = new URLSearchParams(searchParams);
    redirectParams.delete('q');

    if (searchIntent.region) redirectParams.set('region', searchIntent.region);
    if (searchIntent.subRegion) redirectParams.set('subRegion', searchIntent.subRegion);
    if (searchIntent.theme) redirectParams.set('theme', searchIntent.theme);

    return Response.redirect(`${request.nextUrl.origin}${request.nextUrl.pathname}?${redirectParams.toString()}`, 307);
  }

  return Response.json(
    await listShops({
      region: searchParams.get('region') ?? undefined,
      subRegion: searchParams.get('subRegion') ?? undefined,
      theme: searchParams.get('theme') ?? undefined,
      query,
      sort: searchParams.get('sort') ?? undefined,
      regularOffset: Number.isFinite(regularOffset) ? regularOffset : undefined,
      regularLimit: Number.isFinite(regularLimit) && regularLimit > 0 ? regularLimit : undefined,
    }),
  );
}
