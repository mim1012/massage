import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { createNotice, listNotices } from '@/lib/server/communityStore';

export async function GET() {
  try {
    await requireRole('ADMIN');
    return Response.json({ notices: listNotices() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole('ADMIN');
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      isPinned?: boolean;
    };

    if (!body.title?.trim() || !body.content?.trim()) {
      return Response.json({ error: 'title and content are required.' }, { status: 400 });
    }

    return Response.json(
      {
        notice: createNotice({
          title: body.title,
          content: body.content,
          isPinned: Boolean(body.isPinned),
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
