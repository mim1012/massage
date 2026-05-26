import { requireUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { prisma } from '@/lib/db/prisma';
import { createReviewDeleteResponse, normalizePublicReviewPatchInput } from '@/lib/review-route-helpers';
import { deleteReview, updateReview } from '@/lib/server/communityStore';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    
    // 권한 확인 (본인 글 또는 관리자)
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = (await request.json()) as { rating?: number; content?: string };
    const normalized = normalizePublicReviewPatchInput(body);
    const updated = await updateReview(id, normalized);
    if (!updated) {
      return Response.json({ error: '리뷰를 수정하지 못했습니다.' }, { status: 404 });
    }

    return Response.json({ review: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();

    // 권한 확인
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const success = await deleteReview(id);
    return createReviewDeleteResponse(success);
  } catch (error) {
    return errorResponse(error);
  }
}
