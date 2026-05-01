import type { NextRequest } from 'next/server';
import { listShops } from '@/lib/server/shop-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const regularOffset = Number(searchParams.get('regularOffset') ?? 0);
  const regularLimit = Number(searchParams.get('regularLimit') ?? 0);

  return Response.json(
    await listShops({
      region: searchParams.get('region') ?? undefined,
      subRegion: searchParams.get('subRegion') ?? undefined,
      theme: searchParams.get('theme') ?? undefined,
      query: searchParams.get('q') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      regularOffset: Number.isFinite(regularOffset) ? regularOffset : undefined,
      regularLimit: Number.isFinite(regularLimit) && regularLimit > 0 ? regularLimit : undefined,
    }),
  );
}
