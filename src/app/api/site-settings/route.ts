import { getSiteContent } from '@/lib/server/communityStore';

export async function GET() {
  const content = await getSiteContent();

  if (!content) {
    return Response.json({ error: 'site settings not found.' }, { status: 404 });
  }

  return Response.json(content);
}
