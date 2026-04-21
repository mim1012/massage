import { getNoticeById } from '@/lib/server/communityStore';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const notice = await getNoticeById(id);
  if (!notice) {
    return Response.json({ error: '공지를 찾을 수 없습니다.' }, { status: 404 });
  }

  return Response.json({ notice });
}
