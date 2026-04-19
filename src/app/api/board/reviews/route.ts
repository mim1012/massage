import { listReviews } from '@/lib/server/communityStore';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;
  return Response.json({ reviews: await listReviews(Number.isFinite(limit) ? limit : undefined) });
}
