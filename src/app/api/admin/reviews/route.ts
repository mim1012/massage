import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { listManagedReviews } from '@/lib/server/communityStore';

export async function GET(request: Request) {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? url.searchParams.get('q') ?? undefined;
    return Response.json({ reviews: await listManagedReviews(user, search?.trim() || undefined) });
  } catch (error) {
    return errorResponse(error);
  }
}
