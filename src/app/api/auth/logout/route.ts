import { clearSessionCookie, getSessionCookie } from '@/lib/auth/session';
import { deleteSession } from '@/lib/server/auth-store';

export async function POST() {
  const token = await getSessionCookie();
  if (token) {
    await deleteSession();
  }

  await clearSessionCookie();
  return Response.json({ ok: true });
}
