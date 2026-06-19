import { errorResponse } from '@/lib/auth/http';
import { listThemes } from '@/lib/server/theme-store';

const PUBLIC_THEMES_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=600';
export const preferredRegion = 'sin1';

export async function GET() {
  try {
    return Response.json(
      { themes: await listThemes() },
      {
        headers: {
          'Cache-Control': PUBLIC_THEMES_CACHE_CONTROL,
        },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
