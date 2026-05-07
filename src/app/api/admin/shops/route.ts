import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { normalizeShopInputForSave } from '@/lib/server/admin-shop-access';
import { createAdminShop, listManagedShops } from '@/lib/server/communityStore';
import type { Shop } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    const { searchParams } = new URL(request.url);
    const filters = {
      region: searchParams.get('region') ?? undefined,
      q: searchParams.get('q') ?? undefined,
    };
    return Response.json({ shops: await listManagedShops(user, filters) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole('ADMIN', 'OWNER');
    const body = (await request.json()) as { shop?: Shop };
    if (!body.shop) {
      return Response.json({ error: '업소 정보가 필요합니다.' }, { status: 400 });
    }

    if (user.role === 'OWNER' && body.shop.ownerId && body.shop.ownerId !== user.id) {
      return Response.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const shopInput = normalizeShopInputForSave(user, body.shop);

    return Response.json({ shop: await createAdminShop(shopInput) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
