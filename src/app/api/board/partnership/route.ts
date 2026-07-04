import { errorResponse } from '@/lib/auth/http';
import { applyRateLimitHeaders, checkAuthRateLimit } from '@/lib/security/rate-limit';
import { createPartnershipInquiry } from '@/lib/server/communityStore';
import { INPUT_LIMITS, normalizeBoundedString } from '@/lib/validation/input';
import type { PartnershipInquiry } from '@/lib/types';

export async function POST(request: Request) {
  // 무인증 공개 쓰기이므로 IP 기준 레이트리밋으로 스팸/플러드를 막는다.
  const rateLimitResult = await checkAuthRateLimit(request, 'board:partnership');
  if (rateLimitResult.limited) {
    return rateLimitResult.response;
  }

  try {
    const body = (await request.json()) as Partial<PartnershipInquiry>;

    const shopName = normalizeBoundedString(body.shopName, INPUT_LIMITS.shortText);
    const region = normalizeBoundedString(body.region, INPUT_LIMITS.shortText);
    const theme = normalizeBoundedString(body.theme, INPUT_LIMITS.shortText);
    const contactName = normalizeBoundedString(body.contactName, INPUT_LIMITS.name);
    const phone = normalizeBoundedString(body.phone, INPUT_LIMITS.phone);
    const message = normalizeBoundedString(body.message, INPUT_LIMITS.message);

    if (!shopName || !region || !theme || !contactName || !phone || !message) {
      return applyRateLimitHeaders(
        Response.json({ error: '제휴 문의 필수 항목이 누락되었거나 형식이 올바르지 않습니다.' }, { status: 400 }),
        rateLimitResult.headers,
      );
    }

    const subRegion = normalizeBoundedString(body.subRegion, INPUT_LIMITS.shortText) ?? '';
    const kakaoId = normalizeBoundedString(body.kakaoId, INPUT_LIMITS.shortText) ?? undefined;

    const inquiry = await createPartnershipInquiry({
      shopName,
      region,
      subRegion,
      theme,
      contactName,
      phone,
      kakaoId,
      message,
    });

    return applyRateLimitHeaders(Response.json({ inquiry }, { status: 201 }), rateLimitResult.headers);
  } catch (error) {
    return applyRateLimitHeaders(errorResponse(error), rateLimitResult.headers);
  }
}
