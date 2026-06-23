import { requireUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { prisma } from '@/lib/db/prisma';
import { createReviewDeleteResponse, normalizePublicReviewPatchInput } from '@/lib/review-route-helpers';
import { deleteReview, updateReview } from '@/lib/server/communityStore';
import { withDatabaseRetry } from '@/lib/db/retry';

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const existing = await withDatabaseRetry(() => prisma.review.findUnique({ where: { id } }));

    if (!existing) {
      return Response.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return Response.json({ error: '본인이 작성한 리뷰만 수정할 수 있습니다.' }, { status: 403 });
    }

    const rawBody = (await request.json()) as { rating?: number; content?: string };
    const normalized = normalizePublicReviewPatchInput(rawBody);

    const updated = await updateReview(id, normalized);
    if (!updated) {
      return Response.json({ error: '리뷰를 수정하지 못했습니다.' }, { status: 404 });
    }

    return Response.json({ review: { ...updated, userId: undefined, canManage: true } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const existing = await withDatabaseRetry(() => prisma.review.findUnique({ where: { id } }));

    if (!existing) {
      return Response.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return Response.json({ error: '본인이 작성한 리뷰만 삭제할 수 있습니다.' }, { status: 403 });
    }

    const success = await deleteReview(id);
    return createReviewDeleteResponse(success);
  } catch (error) {
    return errorResponse(error);
  }
}
