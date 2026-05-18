import { getPublicLegalDocument } from '@/lib/server/public-legal-documents';

export async function GET() {
  try {
    const doc = await getPublicLegalDocument('partnership');
    return Response.json(doc);
  } catch {
    return Response.json({ error: '제휴입점 설정을 불러오지 못했습니다.' }, { status: 500 });
  }
}
