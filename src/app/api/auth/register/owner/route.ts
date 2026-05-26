import { errorResponse } from '@/lib/auth/http';
import { setSessionCookie } from '@/lib/auth/session';
import { login, registerOwner } from '@/lib/server/auth-store';

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

    if (
      !body.name ||
      !body.email ||
      !body.password ||
      !body.businessName ||
      !body.businessNumber ||
      !body.phone
    ) {
      return Response.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 });
    }

    const user = await registerOwner({
      name: body.name,
      email: body.email,
      password: body.password,
      businessName: body.businessName,
      businessNumber: body.businessNumber,
      phone: body.phone,
    });

    // 승인 전 가입 신청 대기 상태이므로, 자동 로그인을 통한 쿠키 구성을 생략하고 가입 성공으로 반환
    return Response.json({ user, success: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
