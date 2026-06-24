import { errorResponse } from '@/lib/auth/http';
import { listActiveAdBanners } from '@/lib/server/ad-banner-store';

export const preferredRegion = 'sin1';

export async function GET() {
  try {
    const banners = await listActiveAdBanners();
    return Response.json({ banners }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
