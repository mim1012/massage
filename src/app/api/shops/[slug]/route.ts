import { getShopBySlug } from '@/lib/server/shop-store';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const data = await getShopBySlug(slug);
  if (!data) {
    return Response.json({ error: 'Shop not found.' }, { status: 404 });
  }

  return Response.json(data);
}
