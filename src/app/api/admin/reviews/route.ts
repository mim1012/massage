import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { listManagedReviews } from '@/lib/server/communityStore';

export async function GET() {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    return Response.json({ reviews: await listManagedReviews(user) });
  } catch (error) {
    return errorResponse(error);
  }
}
