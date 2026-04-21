import { getSiteContent } from '@/lib/server/communityStore';

export async function GET() {
  const content = await getSiteContent();

  if (!content) {
    return Response.json({ error: '사이트 설정을 찾을 수 없습니다.' }, { status: 404 });
  }

  return Response.json(content);
}
