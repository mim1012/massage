import { getShopBySlug, getShopReviewsBySlug } from '@/lib/server/shop-store';
import { getOptionalSessionUser } from '@/lib/auth/guards';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { errorResponse } from '@/lib/auth/http';
import { sessionJsonResponse } from '@/lib/security/http';

const PUBLIC_SHOP_DETAIL_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';

function hasSessionCookie(request: Request) {
  return request.headers.get('cookie')?.includes(`${SESSION_COOKIE_NAME}=`) ?? false;
}


export const preferredRegion = 'sin1';
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const data = await getShopBySlug(slug);
    if (!data) {
      return Response.json({ error: '업소를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!hasSessionCookie(request)) {
      const shop = { ...data.shop, ownerId: undefined, isVisible: undefined };
      return Response.json(
        { ...data, shop, reviews: [] },
        { headers: { 'Cache-Control': PUBLIC_SHOP_DETAIL_CACHE_CONTROL } },
      );
    }

    const user = await getOptionalSessionUser();
    const reviews = user ? await getShopReviewsBySlug(slug) : [];
    const shop = { ...data.shop, ownerId: undefined, isVisible: undefined };
    return sessionJsonResponse({ ...data, shop, reviews });
  } catch (error) {
    return errorResponse(error);
  }
}
