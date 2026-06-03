import { errorResponse } from '@/lib/auth/http';
import { registerOwnerRoute } from '@/lib/auth/owner-registration';
import { applyRateLimitHeaders, checkAuthRateLimit } from '@/lib/security/rate-limit';
import { registerOwner } from '@/lib/server/auth-store';

type RegisterOwnerBody = {
  name?: string;
  email?: string;
  password?: string;
  businessName?: string;
  phone?: string;
};

type OwnerRegisterPostDeps = {
  checkRateLimit?: typeof checkAuthRateLimit;
  registerOwnerRoute?: typeof registerOwnerRoute;
  registerOwner?: typeof registerOwner;
  errorResponse?: typeof errorResponse;
};

export async function handleOwnerRegisterPost(request: Request, deps: OwnerRegisterPostDeps = {}) {
  const checkRateLimit = deps.checkRateLimit ?? checkAuthRateLimit;
  const registerOwnerRouteHandler = deps.registerOwnerRoute ?? registerOwnerRoute;
  const registerOwnerWithStore = deps.registerOwner ?? registerOwner;
  const respondWithError = deps.errorResponse ?? errorResponse;

  const rateLimitResult = checkRateLimit(request, 'auth:register:owner');
  if (rateLimitResult.limited) {
    return rateLimitResult.response;
  }

  try {
    const body = (await request.json()) as RegisterOwnerBody;

    return applyRateLimitHeaders(
      await registerOwnerRouteHandler(body, { registerOwner: registerOwnerWithStore }),
      rateLimitResult.headers,
    );
  } catch (error) {
    return applyRateLimitHeaders(respondWithError(error), rateLimitResult.headers);
  }
}
