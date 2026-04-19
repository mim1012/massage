import { assertOwnershipOrAdmin, requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { answerQna, getQnaShopOwnerId } from '@/lib/server/communityStore';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    const { id } = await context.params;
    const body = (await request.json()) as { answer?: string };

    if (!body.answer?.trim()) {
      return Response.json({ error: 'answer is required.' }, { status: 400 });
    }

    const qnaAccess = await getQnaShopOwnerId(id);
    if (!qnaAccess.exists) {
      return Response.json({ error: 'Q&A entry not found.' }, { status: 404 });
    }

    assertOwnershipOrAdmin(user, qnaAccess.ownerId);

    const qna = await answerQna(id, body.answer, user.id);
    if (!qna) {
      return Response.json({ error: 'Q&A entry not found.' }, { status: 404 });
    }

    return Response.json({ qna });
  } catch (error) {
    return errorResponse(error);
  }
}
