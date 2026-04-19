import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { updateOwnerStatus } from '@/lib/server/auth-store';

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    await requireRole('ADMIN');
    const { userId } = await context.params;
    const user = await updateOwnerStatus(userId, 'approved');
    if (!user) {
      return Response.json({ error: 'Owner not found.' }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
