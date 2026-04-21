import { getShopBySlug } from '@/lib/server/shop-store';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const data = await getShopBySlug(slug);
  if (!data) {
    return Response.json({ error: '업소를 찾을 수 없습니다.' }, { status: 404 });
  }

  return Response.json(data);
}
