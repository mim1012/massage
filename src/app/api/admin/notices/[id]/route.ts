import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { deleteNotice, getNoticeById, updateNotice } from '@/lib/server/communityStore';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('ADMIN');
    const { id } = await context.params;
    const notice = await getNoticeById(id);
    if (!notice) {
      return Response.json({ error: 'Notice not found.' }, { status: 404 });
    }

    return Response.json({ notice });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('ADMIN');
    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      isPinned?: boolean;
    };

    if (!body.title?.trim() || !body.content?.trim()) {
      return Response.json({ error: 'title and content are required.' }, { status: 400 });
    }

    const notice = await updateNotice(id, {
      title: body.title,
      content: body.content,
      isPinned: Boolean(body.isPinned),
    });
    if (!notice) {
      return Response.json({ error: 'Notice not found.' }, { status: 404 });
    }

    return Response.json({ notice });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('ADMIN');
    const { id } = await context.params;
    if (!(await deleteNotice(id))) {
      return Response.json({ error: 'Notice not found.' }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
