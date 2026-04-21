import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { deleteManagedReview } from '@/lib/server/communityStore';

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, context: Context) {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    const { id } = await context.params;
    const deleted = await deleteManagedReview(user, id);

    if (!deleted) {
      return Response.json({ error: '리뷰를 찾을 수 없거나 권한이 없습니다.' }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
