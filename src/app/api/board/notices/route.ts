import { listNotices } from '@/lib/server/communityStore';

export async function GET() {
  return Response.json({ notices: await listNotices() });
}
