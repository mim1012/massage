import { errorResponse } from '@/lib/auth/http';
import { setSessionCookie } from '@/lib/auth/session';
import { login } from '@/lib/server/auth-store';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return Response.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const result = await login({
      email: body.email,
      password: body.password,
    });

    await setSessionCookie(result.token);
    return Response.json({ user: result.user });
  } catch (error) {
    return errorResponse(error);
  }
}
