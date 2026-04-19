import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { answerQna } from '@/lib/server/communityStore';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole('ADMIN', 'OWNER');
    const { id } = await context.params;
    const body = (await request.json()) as { answer?: string };

    if (!body.answer?.trim()) {
      return Response.json({ error: 'answer is required.' }, { status: 400 });
    }

    const qna = answerQna(id, body.answer);
    if (!qna) {
      return Response.json({ error: 'Q&A entry not found.' }, { status: 404 });
    }

    return Response.json({ qna });
  } catch (error) {
    return errorResponse(error);
  }
}
