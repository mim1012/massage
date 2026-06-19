import { getShopBySlug } from '@/lib/server/shop-store';
import { getSessionUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { sessionJsonResponse } from '@/lib/security/http';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const data = await getShopBySlug(slug);
    const user = await getSessionUser();
    if (!data) {
      return Response.json({ error: '업소를 찾을 수 없습니다.' }, { status: 404 });
    }

    const shop = { ...data.shop, ownerId: undefined, isVisible: undefined };
    return sessionJsonResponse({ ...data, shop, reviews: user ? data.reviews : [] });
  } catch (error) {
    return errorResponse(error);
  }
}
