import { errorResponse } from '@/lib/auth/http';
import { applyRateLimitHeaders, checkAuthRateLimit, type AuthRateLimitChecker } from '@/lib/security/rate-limit';
import { registerUser } from '@/lib/server/auth-store';

type RegisterUserBody = {
  name?: string;
  email?: string;
  password?: string;
};

type UserRegisterPostDeps = {
  checkRateLimit?: AuthRateLimitChecker;
  registerUser?: typeof registerUser;
  errorResponse?: typeof errorResponse;
};

export async function handleUserRegisterPost(request: Request, deps: UserRegisterPostDeps = {}) {
  const checkRateLimit = deps.checkRateLimit ?? checkAuthRateLimit;
  const registerUserWithStore = deps.registerUser ?? registerUser;
  const respondWithError = deps.errorResponse ?? errorResponse;

  const rateLimitResult = await checkRateLimit(request, 'auth:register:user');
  if (rateLimitResult.limited) {
    return rateLimitResult.response;
  }

  try {
    const body = (await request.json()) as RegisterUserBody;

    if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim()) {
      return applyRateLimitHeaders(Response.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 }), rateLimitResult.headers);
    }

    const user = await registerUserWithStore({
      name: body.name.trim(),
      email: body.email.trim(),
      password: body.password,
    });
    return applyRateLimitHeaders(Response.json({ user }, { status: 201 }), rateLimitResult.headers);
  } catch (error) {
    return applyRateLimitHeaders(respondWithError(error), rateLimitResult.headers);
  }
}
