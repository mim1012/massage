import { getBoardSummary } from '@/lib/server/communityStore';
import { getSessionUser } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';

export async function GET() {
  try {
    const [summary, user] = await Promise.all([getBoardSummary(), getSessionUser()]);
    return Response.json(user ? summary : { ...summary, reviews: 0 });
  } catch (error) {
    return errorResponse(error);
  }
}
