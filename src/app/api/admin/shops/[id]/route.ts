import { assertOwnershipOrAdmin, requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { normalizeShopInputForSave } from '@/lib/server/admin-shop-access';
import { getAdminShopById, updateAdminShop } from '@/lib/server/communityStore';
import type { Shop } from '@/lib/types';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    const { id } = await context.params;
    const shop = await getAdminShopById(id);
    if (!shop) {
      return Response.json({ error: 'Shop not found.' }, { status: 404 });
    }

    assertOwnershipOrAdmin(user, shop.ownerId);

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
    const user = await requireRole('ADMIN', 'OWNER');
    const { id } = await context.params;
    const body = (await request.json()) as { shop?: Shop };
    if (!body.shop) {
      return Response.json({ error: 'shop is required.' }, { status: 400 });
    }

    const existingShop = await getAdminShopById(id);
    if (!existingShop) {
      return Response.json({ error: 'Shop not found.' }, { status: 404 });
    }

    assertOwnershipOrAdmin(user, existingShop.ownerId);

    const shopInput = normalizeShopInputForSave(user, body.shop, existingShop);

    const shop = await updateAdminShop(id, shopInput);
    if (!shop) {
      return Response.json({ error: 'Shop not found.' }, { status: 404 });
    }

    return Response.json({ shop });
  } catch (error) {
    return errorResponse(error);
  }
}
