import { proxyShopMediaSource } from '@/lib/server/shop-media';
import { getShopGalleryImageBySlug } from '@/lib/server/shop-store';

export const preferredRegion = 'sin1';

export async function GET(request: Request, context: { params: Promise<{ slug: string; index: string }> }) {
  const { slug, index } = await context.params;
  const parsedIndex = Number.parseInt(index, 10);

  if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
    return Response.json({ error: '이미지를 찾을 수 없습니다.' }, { status: 404 });
  }

  const image = await getShopGalleryImageBySlug(slug, parsedIndex);
  if (!image) {
    return Response.json({ error: '이미지를 찾을 수 없습니다.' }, { status: 404 });
  }

  const variant = new URL(request.url).searchParams.get('size');
  return await proxyShopMediaSource(image.imageUrl, request, variant);
}
