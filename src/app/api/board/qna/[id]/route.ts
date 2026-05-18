import { requireUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { deletePublicQna, updatePublicQna } from '@/lib/server/communityStore';
import { prisma } from '@/lib/db/prisma';
import { QnaStatus } from '@prisma/client';

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireUser();

    const existing = await prisma.qnA.findUnique({
      where: { id },
      include: { _count: { select: { comments: true } } },
    });
    if (!existing) {
      return Response.json({ error: 'Q&A를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    if (existing.status !== QnaStatus.OPEN || existing._count.comments > 0) {
      return Response.json({ error: '답변이 등록된 Q&A는 수정할 수 없습니다.' }, { status: 409 });
    }

    const body = (await request.json()) as { question?: string };
    if (!body.question?.trim()) {
      return Response.json({ error: '질문 내용은 필수입니다.' }, { status: 400 });
    }

    const updated = await updatePublicQna(id, user.id, { question: body.question.trim() }, { id: user.id, role: user.role });
    if (!updated) {
      return Response.json({ error: '질문 상태가 변경되어 수정할 수 없습니다.' }, { status: 409 });
    }

    return Response.json({ qna: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireUser();

    const existing = await prisma.qnA.findUnique({
      where: { id },
      include: { _count: { select: { comments: true } } },
    });
    if (!existing) {
      return Response.json({ error: 'Q&A를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    if (existing.status !== QnaStatus.OPEN || existing._count.comments > 0) {
      return Response.json({ error: '답변이 등록된 Q&A는 삭제할 수 없습니다.' }, { status: 409 });
    }

    const deleted = await deletePublicQna(id, user.id);
    if (!deleted) {
      return Response.json({ error: '질문 상태가 변경되어 삭제할 수 없습니다.' }, { status: 409 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
