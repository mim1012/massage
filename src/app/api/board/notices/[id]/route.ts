import { getNoticeById } from '@/lib/server/communityStore';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const notice = getNoticeById(id);
  if (!notice) {
    return Response.json({ error: 'Notice not found.' }, { status: 404 });
  }

  return Response.json({ notice });
}
