import { AuthError } from '@/lib/auth/guards';

export function errorResponse(error: unknown, fallbackMessage = 'Unexpected server error.') {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    const status =
      error.message === 'EMAIL_IN_USE'
        ? 409
        : error.message === 'INVALID_CREDENTIALS'
          ? 401
          : error.message === 'OWNER_NOT_APPROVED'
            ? 403
            : 400;

    return Response.json({ error: error.message }, { status });
  }

  return Response.json({ error: fallbackMessage }, { status: 500 });
}
