import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { deleteManagedQna, updateQna } from '@/lib/server/communityStore';
import { prisma } from '@/lib/db/prisma';

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireRole('ADMIN');
    const { id } = await context.params;

    const existing = await prisma.qnA.findUnique({ where: { id } });

    if (!existing) {
      return Response.json({ error: 'Q&A를 찾을 수 없습니다.' }, { status: 404 });
    }

    const body = (await request.json()) as { question?: string };
    if (!body.question?.trim()) {
      return Response.json({ error: '질문 내용은 필수입니다.' }, { status: 400 });
    }

    const updated = await updateQna(id, { question: body.question.trim() }, { id: user.id, role: user.role });
    if (!updated) {
      return Response.json({ error: 'Q&A를 수정하지 못했습니다.' }, { status: 404 });
    }

    return Response.json({ qna: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    const { id } = await context.params;
    const deleted = await deleteManagedQna(user, id);

    if (!deleted) {
      return Response.json({ error: 'Q&A를 찾을 수 없거나 권한이 없습니다.' }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
