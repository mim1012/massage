import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';
import { updateShopVisibility } from '@/lib/server/shop-store';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole('ADMIN');
    const { id } = await context.params;
    const body = (await request.json()) as { isVisible?: boolean };
    if (typeof body.isVisible !== 'boolean') {
      return Response.json({ error: 'isVisible must be provided.' }, { status: 400 });
    }

    const shop = await updateShopVisibility(id, body.isVisible);
    if (!shop) {
      return Response.json({ error: 'Shop not found.' }, { status: 404 });
    }

    return Response.json({ shop });
  } catch (error) {
    return errorResponse(error);
  }
}
