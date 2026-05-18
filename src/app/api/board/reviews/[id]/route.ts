import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { deleteReview, updateReview } from '@/lib/server/communityStore';

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const existing = await prisma.review.findUnique({ where: { id } });

    if (!existing) {
      return Response.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = (await request.json()) as { rating?: number; content?: string };
    if (body.rating !== undefined && (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5)) {
      return Response.json({ error: '평점은 1점부터 5점 사이여야 합니다.' }, { status: 400 });
    }
    if (body.content !== undefined && !body.content.trim()) {
      return Response.json({ error: '리뷰 내용을 입력해주세요.' }, { status: 400 });
    }

    const review = await updateReview(id, body);
    if (!review) {
      return Response.json({ error: '리뷰를 수정하지 못했습니다.' }, { status: 500 });
    }

    return Response.json({ review });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const existing = await prisma.review.findUnique({ where: { id } });

    if (!existing) {
      return Response.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const deleted = await deleteReview(id);
    if (!deleted) {
      return Response.json({ error: '리뷰를 삭제하지 못했습니다.' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
