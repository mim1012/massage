import { getOptionalSessionUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { getShopReviewsBySlug } from '@/lib/server/shop-store';
import { sessionJsonResponse } from '@/lib/security/http';

export const preferredRegion = 'sin1';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await getOptionalSessionUser();
    if (!user) {
      return sessionJsonResponse({ reviews: [] }, { status: 401 });
    }

    const { slug } = await context.params;
    const reviews = await getShopReviewsBySlug(slug);
    return sessionJsonResponse({ reviews });
  } catch (error) {
    return errorResponse(error);
  }
}
