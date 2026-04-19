import { errorResponse } from '@/lib/auth/http';
import { registerUser } from '@/lib/server/auth-store';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!body.name || !body.email || !body.password) {
      return Response.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const user = await registerUser({
      name: body.name,
      email: body.email,
      password: body.password,
    });
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
