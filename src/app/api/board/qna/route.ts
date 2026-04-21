import { requireUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { createQna, listQna } from '@/lib/server/communityStore';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shopId = url.searchParams.get('shopId') ?? undefined;
  return Response.json({ qna: await listQna(shopId) });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as {
      question?: string;
      shopId?: string | null;
    };

    if (!body.question?.trim()) {
      return Response.json({ error: '질문 내용은 필수입니다.' }, { status: 400 });
    }

    return Response.json(
      {
        qna: await createQna({
          question: body.question,
          authorName: user.name,
          userId: user.id,
          shopId: body.shopId?.trim() || undefined,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
