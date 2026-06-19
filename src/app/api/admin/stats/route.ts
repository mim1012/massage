import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { getCachedAdminStatsData } from '@/lib/server/admin-stats';

export async function GET() {
  try {
    await requireRole('ADMIN');
    return Response.json(await getCachedAdminStatsData());
  } catch (error) {
    return errorResponse(error);
  }
}
