import type { NextRequest } from 'next/server';
import { listShops } from '@/lib/server/shop-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  return Response.json(
    await listShops({
      region: searchParams.get('region') ?? undefined,
      subRegion: searchParams.get('subRegion') ?? undefined,
      theme: searchParams.get('theme') ?? undefined,
      query: searchParams.get('q') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
    }),
  );
}
