import { getSessionUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { createReview, listReviews } from '@/lib/server/communityStore';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const shopId = url.searchParams.get('shopId') ?? undefined;
    const search = url.searchParams.get('search') ?? url.searchParams.get('q') ?? undefined;
    const limit = limitParam ? Number(limitParam) : undefined;

    return Response.json({
      reviews: await listReviews({
        limit: Number.isFinite(limit) ? limit : undefined,
        shopId: shopId?.trim() || undefined,
        search: search?.trim() || undefined,
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = (await request.json()) as {
      shopId?: string;
      authorName?: string;
      rating?: number;
      content?: string;
    };

    if (!body.shopId?.trim() || !body.authorName?.trim() || !body.content?.trim() || typeof body.rating !== 'number') {
      return Response.json({ error: '업소, 작성자, 평점, 리뷰 내용은 필수입니다.' }, { status: 400 });
    }

    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return Response.json({ error: '평점은 1점부터 5점 사이여야 합니다.' }, { status: 400 });
    }

    return Response.json(
      {
        review: await createReview({
          shopId: body.shopId.trim(),
          userId: user?.id,
          authorName: body.authorName,
          rating: body.rating,
          content: body.content,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
