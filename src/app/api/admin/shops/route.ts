import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { createAdminShop, listAdminShops } from '@/lib/server/communityStore';
import type { Shop } from '@/lib/types';

export async function GET() {
  try {
    await requireRole('ADMIN');
    return Response.json({ shops: listAdminShops() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole('ADMIN', 'OWNER');
    const body = (await request.json()) as { shop?: Shop };
    if (!body.shop) {
      return Response.json({ error: 'shop is required.' }, { status: 400 });
    }

    return Response.json({ shop: createAdminShop(body.shop) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
