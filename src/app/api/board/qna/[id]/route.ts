import { requireUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { deleteQna, updateQna } from '@/lib/server/communityStore';
import { prisma } from '@/lib/db/prisma';

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireUser();

    // Check permissions (must be author or admin)
    const existing = await prisma.qnA.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Q&A를 찾을 수 없습니다.' }, { status: 404 });
    }
    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = (await request.json()) as { question?: string };
    if (!body.question?.trim()) {
      return Response.json({ error: '질문 내용은 필수입니다.' }, { status: 400 });
    }

    const updated = await updateQna(id, { question: body.question.trim() }, { id: user.id, role: user.role });
    return Response.json({ qna: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireUser();

    // Check permissions (must be author or admin)
    const existing = await prisma.qnA.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Q&A를 찾을 수 없습니다.' }, { status: 404 });
    }
    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const success = await deleteQna(id);
    return Response.json({ success });
  } catch (error) {
    return errorResponse(error);
  }
}
