import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';

// 임시 진단용: Upstash/KV 연동 변수의 "이름"만 확인한다. 값은 절대 반환하지 않는다.
export async function GET() {
  try {
    await requireRole('ADMIN');

    const matchingNames = Object.keys(process.env)
      .filter((key) => /redis|kv|upstash/i.test(key))
      .sort();

    return Response.json(
      { names: matchingNames },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
