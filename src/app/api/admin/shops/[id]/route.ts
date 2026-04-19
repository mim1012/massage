import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { getAdminShopById, updateAdminShop } from '@/lib/server/communityStore';
import type { Shop } from '@/lib/types';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole('ADMIN', 'OWNER');
    const { id } = await context.params;
    const shop = await getAdminShopById(id);
    if (!shop) {
      return Response.json({ error: 'Shop not found.' }, { status: 404 });
    }

    return Response.json({ shop });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole('ADMIN', 'OWNER');
    const { id } = await context.params;
    const body = (await request.json()) as { shop?: Shop };
    if (!body.shop) {
      return Response.json({ error: 'shop is required.' }, { status: 400 });
    }

    const shop = await updateAdminShop(id, body.shop);
    if (!shop) {
      return Response.json({ error: 'Shop not found.' }, { status: 404 });
    }

    return Response.json({ shop });
  } catch (error) {
    return errorResponse(error);
  }
}
