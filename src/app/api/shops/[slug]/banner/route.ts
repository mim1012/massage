import { proxyShopMediaSource } from '@/lib/server/shop-media';
import { getShopBannerBySlug } from '@/lib/server/shop-store';

export const preferredRegion = 'sin1';

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const banner = await getShopBannerBySlug(slug);

  if (!banner) {
    return Response.json({ error: '이미지를 찾을 수 없습니다.' }, { status: 404 });
  }

  const variant = new URL(request.url).searchParams.get('size');
  return await proxyShopMediaSource(banner.bannerUrl, request, variant);
}
