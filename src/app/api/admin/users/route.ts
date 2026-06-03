import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { listUsers } from '@/lib/server/auth-store';

export async function GET() {
  try {
    await requireRole('ADMIN');
    const users = await listUsers();
    return Response.json({ users });
  } catch (error) {
    return errorResponse(error);
  }
}
