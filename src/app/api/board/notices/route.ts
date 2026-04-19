import { listNotices } from '@/lib/server/communityStore';

export function GET() {
  return Response.json({ notices: listNotices() });
}
