import { getBoardSummary } from '@/lib/server/communityStore';

export function GET() {
  return Response.json(getBoardSummary());
}
