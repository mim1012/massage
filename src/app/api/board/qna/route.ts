import { getSessionUser, requireUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { createQna, listQna } from '@/lib/server/communityStore';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const shopId = url.searchParams.get('shopId') ?? undefined;
    const search = url.searchParams.get('search') ?? url.searchParams.get('q') ?? undefined;
    const viewer = await getSessionUser();

    return Response.json({
      qna: await listQna({
        shopId,
        search: search?.trim() || undefined,
        viewer: viewer ? { id: viewer.id, role: viewer.role } : undefined,
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
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
        qna: await createQna(
          {
            question: body.question,
            authorName: user.name,
            userId: user.id,
            shopId: body.shopId?.trim() || undefined,
          },
          { id: user.id, role: user.role },
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
