import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { prisma } from '@/lib/db/prisma';
import { withDatabaseRetry } from '@/lib/db/retry';
import { createReview, listManagedReviews } from '@/lib/server/communityStore';

export async function GET(request: Request) {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? url.searchParams.get('q') ?? undefined;
    return Response.json({ reviews: await listManagedReviews(user, search?.trim() || undefined) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole('ADMIN');
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

    const shopId = body.shopId.trim();
    const authorName = body.authorName.trim();
    const content = body.content.trim();

    const shop = await withDatabaseRetry(() =>
      prisma.shop.findUnique({
        where: { id: shopId },
        select: { ownerId: true },
      }),
    );

    if (!shop) {
      return Response.json({ error: '업소를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && shop.ownerId !== user.id) {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const review = await createReview({
      shopId,
      userId: user.id,
      authorName,
      rating: body.rating,
      content,
    });

    if (!review) {
      return Response.json({ error: '리뷰를 등록하지 못했습니다.' }, { status: 500 });
    }

    return Response.json({ review }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
