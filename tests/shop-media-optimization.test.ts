import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getShopMediaVariant, proxyShopMediaSource } from '@/lib/server/shop-media';

const ONE_BY_ONE_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+pQ6kAAAAASUVORK5CYII=';
const ONE_BY_ONE_PNG_DATA_URL = `data:image/png;base64,${ONE_BY_ONE_PNG_BASE64}`;

test('getShopMediaVariant falls back to card and keeps known presets', () => {
  assert.equal(getShopMediaVariant(undefined), 'card');
  assert.equal(getShopMediaVariant('hero'), 'hero');
  assert.equal(getShopMediaVariant('premium-card'), 'premium-card');
  assert.equal(getShopMediaVariant('not-a-real-size'), 'card');
});

test('proxyShopMediaSource optimizes data URLs to the best accepted format', async () => {
  const request = new Request('https://example.com/api/shops/demo/thumbnail?size=hero', {
    headers: {
      accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
  });

  const response = await proxyShopMediaSource(ONE_BY_ONE_PNG_DATA_URL, request, 'hero');
  const body = Buffer.from(await response.arrayBuffer());

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal(response.headers.get('vary'), 'Accept');
  assert.equal(response.headers.get('content-type'), 'image/avif');
  assert.ok(body.length > 0);
});

test('proxyShopMediaSource resolves same-origin sources and resizes them through the optimizer', async () => {
  const originalFetch = global.fetch;
  const calls: Array<{ input: string; init: RequestInit | undefined }> = [];

  global.fetch = async (input, init) => {
    calls.push({ input: String(input), init });
    return new Response(Buffer.from(ONE_BY_ONE_PNG_BASE64, 'base64'), {
      status: 200,
      headers: {
        'content-type': 'image/png',
      },
    });
  };

  try {
    const request = new Request('https://example.com/api/shops/demo/banner?size=hero', {
      headers: {
        accept: 'image/webp,image/*,*/*;q=0.8',
      },
    });

    const response = await proxyShopMediaSource('/images/demo.png', request, 'hero');
    const body = Buffer.from(await response.arrayBuffer());

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.input, 'https://example.com/images/demo.png');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/webp');
    assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    assert.ok(body.length > 0);
  } finally {
    global.fetch = originalFetch;
  }
});
