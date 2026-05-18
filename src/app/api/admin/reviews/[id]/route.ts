import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { deleteManagedReview, updateReview } from '@/lib/server/communityStore';
import { prisma } from '@/lib/db/prisma';

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    const { id } = await context.params;

    // Check permissions
    const existing = await prisma.review.findUnique({
      where: { id },
      include: { shop: { select: { ownerId: true } } },
    });
    if (!existing) {
      return Response.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    }
    if (user.role !== 'ADMIN' && existing.shop.ownerId !== user.id) {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = (await request.json()) as { rating?: number; content?: string; authorName?: string };
    const updated = await updateReview(id, body);

    return Response.json({ review: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

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
