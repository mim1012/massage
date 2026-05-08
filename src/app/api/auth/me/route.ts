import { getSessionUser } from '@/lib/auth/guards';

export async function GET() {
  const user = await getSessionUser();

  return Response.json({ user: user ?? null });
}
