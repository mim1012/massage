import { AuthError } from '@/lib/auth/guards';

const errorMessageMap: Record<string, string> = {
  EMAIL_IN_USE: '이미 사용 중인 이메일입니다.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  OWNER_NOT_APPROVED: '업주 계정은 관리자 승인 후 로그인할 수 있습니다.',
};

export function errorResponse(error: unknown, fallbackMessage = '예상하지 못한 서버 오류가 발생했습니다.') {
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

    return Response.json({ error: errorMessageMap[error.message] ?? error.message }, { status });
  }

  return Response.json({ error: fallbackMessage }, { status: 500 });
}
