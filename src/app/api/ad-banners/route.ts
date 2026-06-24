import { errorResponse } from '@/lib/auth/http';
import { listActiveAdBanners } from '@/lib/server/ad-banner-store';

export const preferredRegion = 'sin1';

export async function GET() {
  try {
    const banners = await listActiveAdBanners();
    return Response.json(
      { banners },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
