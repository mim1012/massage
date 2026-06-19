import { getSessionUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { sessionJsonResponse } from '@/lib/security/http';

export async function GET() {
  try {
    const user = await getSessionUser();

    return sessionJsonResponse({ user: user ?? null });
  } catch (error) {
    return errorResponse(error);
  }
}
