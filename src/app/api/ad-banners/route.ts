import { errorResponse } from '@/lib/auth/http';
import { listActiveAdBanners } from '@/lib/server/ad-banner-store';

export const preferredRegion = 'sin1';
const PUBLIC_AD_BANNERS_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';


export async function GET() {
  try {
    const banners = await listActiveAdBanners();
    return Response.json({ banners }, { headers: { 'Cache-Control': PUBLIC_AD_BANNERS_CACHE_CONTROL } });
  } catch (error) {
    return errorResponse(error);
  }
}
