import { errorResponse } from '@/lib/auth/http';
import { setSessionCookie } from '@/lib/auth/session';
import { applyRateLimitHeaders, checkAuthRateLimit } from '@/lib/security/rate-limit';
import { login } from '@/lib/server/auth-store';

type LoginBody = {
  email?: string;
  password?: string;
  audience?: LoginAudience;
};
type LoginAudience = 'user' | 'owner';


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

  const ipRateLimitResult = checkRateLimit(request, 'auth:login:ip');
  if (ipRateLimitResult.limited) {
    return ipRateLimitResult.response;
  }

  let rateLimitHeaders: Headers | null = ipRateLimitResult.headers;

  try {
    const body = (await request.json()) as LoginBody;

    if (!body.email || !body.password) {
      return applyRateLimitHeaders(Response.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 }), rateLimitHeaders);
    }

    const credentialRateLimitResult = checkRateLimit(request, 'auth:login:credential', { credential: body.email });
    if (credentialRateLimitResult.limited) {
      return credentialRateLimitResult.response;
    }
    rateLimitHeaders = credentialRateLimitResult.headers;

    if (body.audience && !['user', 'owner'].includes(body.audience)) {
      return applyRateLimitHeaders(Response.json({ error: '로그인 유형이 올바르지 않습니다.' }, { status: 400 }), rateLimitHeaders);
    }

    const result = await loginWithStore({
      email: body.email,
      password: body.password,
    });

    if (body.audience === 'user' && result.user.role === 'OWNER') {
      return applyRateLimitHeaders(Response.json({ error: '업주 계정은 사장님 로그인에서 로그인해 주세요.' }, { status: 403 }), rateLimitHeaders);
    }

    if (body.audience === 'owner' && result.user.role === 'USER') {
      return applyRateLimitHeaders(Response.json({ error: '일반 회원 계정은 일반 고객 로그인에서 로그인해 주세요.' }, { status: 403 }), rateLimitHeaders);
    }

    await setCookie(result.token);
    return applyRateLimitHeaders(Response.json({ user: result.user }), rateLimitHeaders);
  } catch (error) {
    const response = respondWithError(error);
    return rateLimitHeaders ? applyRateLimitHeaders(response, rateLimitHeaders) : response;
  }
}
