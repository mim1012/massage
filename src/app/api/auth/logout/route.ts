import { clearSessionCookie, getSessionCookie } from '@/lib/auth/session';
import { deleteSession } from '@/lib/server/auth-store';
import { errorResponse } from '@/lib/auth/http';
import { sessionJsonResponse } from '@/lib/security/http';

export async function POST() {
  try {
    const token = await getSessionCookie();
    if (token) {
      await deleteSession(token);
    }

    await clearSessionCookie();
    return sessionJsonResponse({ ok: true });
  } catch (error) {
    await clearSessionCookie();
    return errorResponse(error);
  }
}
