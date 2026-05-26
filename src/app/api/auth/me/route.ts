import { getSessionUser } from '@/lib/auth/guards';
import { sessionJsonResponse } from '@/lib/security/http';

export async function GET() {
  const user = await getSessionUser();

  return sessionJsonResponse({ user: user ?? null });
}
