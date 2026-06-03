import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { listQna } from '@/lib/server/communityStore';

export async function GET(request: Request) {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? url.searchParams.get('q') ?? undefined;
    const shopId =
      user.role === 'OWNER'
        ? (user.managedShopId ?? undefined)
        : (url.searchParams.get('shopId') ?? undefined);

    const qnaList = await listQna({
      search: search?.trim() || undefined,
      shopId,
      viewer: { id: user.id, role: user.role },
    });

    return Response.json({ qnaList });
  } catch (error) {
    return errorResponse(error);
  }
}
