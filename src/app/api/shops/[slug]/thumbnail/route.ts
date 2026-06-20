import { getShopThumbnailBySlug } from '@/lib/server/shop-store';

export const preferredRegion = 'sin1';

const DATA_URL_PATTERN = /^data:([^;,]+)(;base64)?,([\s\S]*)$/;

function parseDataUrl(value: string) {
  const match = value.match(DATA_URL_PATTERN);
  if (!match) {
    return null;
  }

  const [, contentType, base64Flag, payload] = match;
  const body = base64Flag ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload));

  return {
    body,
    contentType,
  };
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const thumbnail = await getShopThumbnailBySlug(slug);

  if (!thumbnail) {
    return Response.json({ error: '이미지를 찾을 수 없습니다.' }, { status: 404 });
  }

  const source = thumbnail.thumbnailUrl.trim();
  const dataUrl = parseDataUrl(source);
  const cacheControl = 'public, max-age=31536000, immutable';

  if (dataUrl) {
    return new Response(dataUrl.body, {
      headers: {
        'Cache-Control': cacheControl,
        'Content-Type': dataUrl.contentType,
      },
    });
  }

  return Response.redirect(source, 307);
}
