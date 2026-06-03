import { errorResponse } from '@/lib/auth/http';
import { listThemes } from '@/lib/server/theme-store';

export async function GET() {
  try {
    return Response.json({ themes: await listThemes() });
  } catch (error) {
    return errorResponse(error);
  }
}
