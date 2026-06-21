import sharp from 'sharp';

const DATA_URL_PATTERN = /^data:([^;,]+)(;base64)?,([\s\S]*)$/;
const IMMUTABLE_IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const SHORT_ERROR_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

const SHOP_MEDIA_VARIANTS = {
  card: { width: 320, height: 320, quality: 64 },
  'premium-card': { width: 480, height: 480, quality: 68 },
  gallery: { width: 720, height: 720, quality: 72 },
  hero: { width: 960, height: 960, quality: 70 },
} as const;

export type ShopMediaVariant = keyof typeof SHOP_MEDIA_VARIANTS;

export function parseDataUrl(value: string) {
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

export function getShopMediaVariant(value?: string | null): ShopMediaVariant {
  return value && value in SHOP_MEDIA_VARIANTS ? (value as ShopMediaVariant) : 'card';
}

function buildImmutableImageHeaders(contentType?: string | null, contentLength?: number) {
  const headers = new Headers({
    'Cache-Control': IMMUTABLE_IMAGE_CACHE_CONTROL,
    Vary: 'Accept',
  });

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  if (typeof contentLength === 'number' && Number.isFinite(contentLength)) {
    headers.set('Content-Length', String(contentLength));
  }

  return headers;
}

function toResponseBody(body: Buffer) {
  return new Uint8Array(body);
}

function getTransformTargetContentType(contentType: string | null, acceptHeader: string | null) {
  const normalizedContentType = contentType?.toLowerCase() ?? '';
  const normalizedAccept = acceptHeader?.toLowerCase() ?? '';

  if (normalizedAccept.includes('image/avif')) {
    return 'image/avif' as const;
  }

  if (normalizedAccept.includes('image/webp')) {
    return 'image/webp' as const;
  }

  if (normalizedContentType.includes('png')) {
    return 'image/png' as const;
  }

  return 'image/jpeg' as const;
}

function shouldBypassOptimization(contentType: string | null) {
  const normalizedContentType = contentType?.toLowerCase() ?? '';
  return normalizedContentType.includes('svg') || normalizedContentType.includes('gif');
}

async function optimizeShopMediaBuffer(
  body: Buffer,
  contentType: string | null,
  variant: ShopMediaVariant,
  acceptHeader: string | null,
) {
  if (shouldBypassOptimization(contentType)) {
    return null;
  }

  const targetContentType = getTransformTargetContentType(contentType, acceptHeader);
  const { width, height, quality } = SHOP_MEDIA_VARIANTS[variant];

  try {
    const pipeline = sharp(body, { animated: false, failOn: 'none' })
      .rotate()
      .resize({
        width,
        height,
        fit: 'inside',
        withoutEnlargement: true,
      });

    switch (targetContentType) {
      case 'image/avif':
        return {
          body: await pipeline.avif({ quality, effort: 3 }).toBuffer(),
          contentType: targetContentType,
        };
      case 'image/webp':
        return {
          body: await pipeline.webp({ quality }).toBuffer(),
          contentType: targetContentType,
        };
      case 'image/png':
        return {
          body: await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer(),
          contentType: targetContentType,
        };
      default:
        return {
          body: await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer(),
          contentType: targetContentType,
        };
    }
  } catch {
    return null;
  }
}

function resolveShopMediaUrl(source: string, request: Request) {
  if (source.startsWith('/')) {
    return new URL(source, request.url);
  }

  const remoteUrl = URL.parse(source);
  if (!remoteUrl || (remoteUrl.protocol !== 'http:' && remoteUrl.protocol !== 'https:')) {
    return null;
  }

  return remoteUrl;
}

export async function proxyShopMediaSource(source: string, request: Request, variantInput?: string | null) {
  const trimmedSource = source.trim();
  const variant = getShopMediaVariant(variantInput);
  const acceptHeader = request.headers.get('accept');
  const dataUrl = parseDataUrl(trimmedSource);

  if (dataUrl) {
    const optimizedDataUrl = await optimizeShopMediaBuffer(dataUrl.body, dataUrl.contentType, variant, acceptHeader);
    const responseBody = optimizedDataUrl?.body ?? dataUrl.body;
    const responseContentType = optimizedDataUrl?.contentType ?? dataUrl.contentType;

    return new Response(toResponseBody(responseBody), {
      headers: buildImmutableImageHeaders(responseContentType, responseBody.length),
    });
  }

  if (!trimmedSource) {
    return new Response(null, {
      status: 404,
      headers: {
        'Cache-Control': SHORT_ERROR_CACHE_CONTROL,
      },
    });
  }

  const resolvedSourceUrl = resolveShopMediaUrl(trimmedSource, request);
  if (!resolvedSourceUrl) {
    return new Response(null, {
      status: 404,
      headers: {
        'Cache-Control': SHORT_ERROR_CACHE_CONTROL,
      },
    });
  }

  const upstream = await fetch(resolvedSourceUrl, {
    cache: 'force-cache',
    redirect: 'follow',
    headers: {
      Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
  });

  if (!upstream.ok) {
    return new Response(null, {
      status: 502,
      headers: {
        'Cache-Control': SHORT_ERROR_CACHE_CONTROL,
      },
    });
  }

  const originalBody = Buffer.from(await upstream.arrayBuffer());
  if (originalBody.length === 0) {
    return new Response(null, {
      status: 502,
      headers: {
        'Cache-Control': SHORT_ERROR_CACHE_CONTROL,
      },
    });
  }

  const upstreamContentType = upstream.headers.get('content-type');
  const optimizedBody = await optimizeShopMediaBuffer(originalBody, upstreamContentType, variant, acceptHeader);
  const responseBody = optimizedBody?.body ?? originalBody;
  const responseContentType = optimizedBody?.contentType ?? upstreamContentType;

  return new Response(toResponseBody(responseBody), {
    headers: buildImmutableImageHeaders(responseContentType, responseBody.length),
  });
}