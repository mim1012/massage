import { getBoardSummary } from '@/lib/server/communityStore';
import { getOptionalSessionUser } from '@/lib/auth/guards';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { errorResponse } from '@/lib/auth/http';
import { sessionJsonResponse } from '@/lib/security/http';

const PUBLIC_BOARD_SUMMARY_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';

function hasSessionCookie(request: Request) {
  return request.headers.get('cookie')?.includes(`${SESSION_COOKIE_NAME}=`) ?? false;
}


export async function GET(request: Request) {
  try {
    const summary = await getBoardSummary();

    if (!hasSessionCookie(request)) {
      return Response.json(
        { ...summary, reviews: 0 },
        { headers: { 'Cache-Control': PUBLIC_BOARD_SUMMARY_CACHE_CONTROL } },
      );
    }

    const user = await getOptionalSessionUser();
    return sessionJsonResponse(user ? summary : { ...summary, reviews: 0 });
  } catch (error) {
    return errorResponse(error);
  }
}
