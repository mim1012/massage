import { listNotices } from '@/lib/server/communityStore';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') ?? url.searchParams.get('q') ?? undefined;

  return Response.json({ notices: await listNotices({ search: search?.trim() || undefined }) });
}
