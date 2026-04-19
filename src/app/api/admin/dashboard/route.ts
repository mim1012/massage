import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { getAdminDashboardData } from '@/lib/server/communityStore';

export async function GET() {
  try {
    await requireRole('ADMIN');
    return Response.json(await getAdminDashboardData());
  } catch (error) {
    return errorResponse(error);
  }
}
