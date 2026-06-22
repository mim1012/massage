import { getShopBySlug, getShopReviewsBySlug } from '@/lib/server/shop-store';
import { getOptionalSessionUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { sessionJsonResponse } from '@/lib/security/http';

export const preferredRegion = 'sin1';
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const data = await getShopBySlug(slug);
    if (!data) {
      return Response.json({ error: '업소를 찾을 수 없습니다.' }, { status: 404 });
    }

    const user = await getOptionalSessionUser();
    const reviews = user ? await getShopReviewsBySlug(slug) : [];
    const shop = { ...data.shop, ownerId: undefined, isVisible: undefined };
    return sessionJsonResponse({ ...data, shop, reviews });
  } catch (error) {
    return errorResponse(error);
  }
}
