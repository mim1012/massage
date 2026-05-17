import { errorResponse } from '@/lib/auth/http';
import { registerOwnerRoute } from '@/lib/auth/owner-registration';
import { registerOwner } from '@/lib/server/auth-store';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      businessName?: string;
      businessNumber?: string;
      phone?: string;
    };

    return await registerOwnerRoute(body, { registerOwner });
  } catch (error) {
    return errorResponse(error);
  }
}
