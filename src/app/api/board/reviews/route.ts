import { requireUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { prisma } from '@/lib/db/prisma';
import { withDatabaseRetry } from '@/lib/db/retry';
import { createReview, listReviews } from '@/lib/server/communityStore';

export async function GET(request: Request) {
  try {
    const user = await requireUser();
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
        viewer: { id: user.id, role: user.role },
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as {
      shopId?: string;
      authorName?: string;
      rating?: number;
      content?: string;
    };

    if (!body.shopId?.trim() || !body.content?.trim() || typeof body.rating !== 'number') {
      return Response.json({ error: '업소, 평점, 리뷰 내용은 필수입니다.' }, { status: 400 });
    }

    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return Response.json({ error: '평점은 1점부터 5점 사이여야 합니다.' }, { status: 400 });
    }

    const shopId = body.shopId.trim();
    const content = body.content.trim();
    const shop = await withDatabaseRetry(() =>
      prisma.shop.findFirst({
        where: { id: shopId, isVisible: true },
        select: { id: true },
      }),
    );
    if (!shop) {
      return Response.json({ error: '업소를 찾을 수 없습니다.' }, { status: 404 });
    }

    const createdReview = await createReview({
      shopId,
      userId: user.id,
      authorName: user.name,
      rating: body.rating,
      content,
    });
    const review = { ...createdReview, canManage: true };
    delete review.userId;
    return Response.json({ review }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
