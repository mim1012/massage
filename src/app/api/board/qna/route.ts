import { createQna, listQna } from '@/lib/server/communityStore';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shopId = url.searchParams.get('shopId') ?? undefined;
  return Response.json({ qna: await listQna(shopId) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    question?: string;
    authorName?: string;
    shopId?: string | null;
  };

  if (!body.question?.trim() || !body.authorName?.trim()) {
    return Response.json({ error: 'question and authorName are required.' }, { status: 400 });
  }

  return Response.json(
    {
      qna: await createQna({
        question: body.question,
        authorName: body.authorName,
        shopId: body.shopId?.trim() || undefined,
      }),
    },
    { status: 201 },
  );
}
