import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { listQna } from '@/lib/server/communityStore';

export async function GET(request: Request) {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? url.searchParams.get('q') ?? undefined;
    const shopId = user.role !== 'OWNER' ? (url.searchParams.get('shopId') ?? undefined) : undefined;
    const shopOwnerId = user.role === 'OWNER' ? user.id : undefined;

    const qnaList = await listQna({
      search: search?.trim() || undefined,
      shopId,
      shopOwnerId,
      viewer: { id: user.id, role: user.role },
    });

    return Response.json({ qnaList });
  } catch (error) {
    return errorResponse(error);
  }
}
