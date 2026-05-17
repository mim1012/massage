import { errorResponse } from '@/lib/auth/http';
import { setSessionCookie } from '@/lib/auth/session';
import { applyRateLimitHeaders, checkAuthRateLimit } from '@/lib/security/rate-limit';
import { login } from '@/lib/server/auth-store';

type LoginBody = {
  email?: string;
  password?: string;
};

type LoginPostDeps = {
  checkRateLimit?: typeof checkAuthRateLimit;
  login?: typeof login;
  setSessionCookie?: typeof setSessionCookie;
  errorResponse?: typeof errorResponse;
};

export async function handleLoginPost(request: Request, deps: LoginPostDeps = {}) {
  const checkRateLimit = deps.checkRateLimit ?? checkAuthRateLimit;
  const loginWithStore = deps.login ?? login;
  const setCookie = deps.setSessionCookie ?? setSessionCookie;
  const respondWithError = deps.errorResponse ?? errorResponse;
  let rateLimitHeaders: Headers | null = null;

  try {
    const body = (await request.json()) as LoginBody;
    const rateLimitResult = checkRateLimit(request, 'auth:login', { credential: body.email });
    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }
    rateLimitHeaders = rateLimitResult.headers;

    if (!body.email || !body.password) {
      return applyRateLimitHeaders(Response.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 }), rateLimitHeaders);
    }

    const result = await loginWithStore({
      email: body.email,
      password: body.password,
    });

    await setCookie(result.token);
    return applyRateLimitHeaders(Response.json({ user: result.user }), rateLimitHeaders);
  } catch (error) {
    const response = respondWithError(error);
    return rateLimitHeaders ? applyRateLimitHeaders(response, rateLimitHeaders) : response;
  }
}
