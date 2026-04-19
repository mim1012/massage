import { getBoardSummary } from '@/lib/server/communityStore';

export async function GET() {
  return Response.json(await getBoardSummary());
}
