import { createPartnershipInquiry } from '@/lib/server/communityStore';
import type { PartnershipInquiry } from '@/lib/types';

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<PartnershipInquiry>;

  const requiredFields: Array<keyof PartnershipInquiry> = [
    'shopName',
    'region',
    'theme',
    'contactName',
    'phone',
    'message',
  ];

  if (requiredFields.some((field) => !body[field]?.toString().trim())) {
    return Response.json({ error: '제휴 문의 필수 항목이 누락되었습니다.' }, { status: 400 });
  }

  const inquiry = await createPartnershipInquiry({
    shopName: body.shopName!,
    region: body.region!,
    subRegion: body.subRegion!,
    theme: body.theme!,
    contactName: body.contactName!,
    phone: body.phone!,
    kakaoId: body.kakaoId,
    message: body.message!,
  });

  return Response.json({ inquiry }, { status: 201 });
}
