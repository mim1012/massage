import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '@/app/api/cron/prewarm-directory/route';

test('prewarm-directory cron fails closed when CRON_SECRET is not configured', async (t) => {
  const originalSecret = process.env.CRON_SECRET;
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;

  delete process.env.CRON_SECRET;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  t.after(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
    globalThis.fetch = originalFetch;
  });

  const response = await GET(new Request('https://example.com/api/cron/prewarm-directory'));
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(body, { error: 'Unauthorized' });
  assert.equal(fetchCalls, 0);
});

test('prewarm-directory cron requires the configured bearer token', async (t) => {
  const originalSecret = process.env.CRON_SECRET;
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;

  process.env.CRON_SECRET = 'secret-token';
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  t.after(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
    globalThis.fetch = originalFetch;
  });

  const unauthorized = await GET(new Request('https://example.com/api/cron/prewarm-directory'));
  assert.equal(unauthorized.status, 401);
  assert.equal(fetchCalls, 0);

  const authorized = await GET(new Request('https://example.com/api/cron/prewarm-directory', {
    headers: { authorization: 'Bearer secret-token' },
  }));
  const body = await authorized.json();

  assert.equal(authorized.status, 200);
  assert.equal(body.ok, true);
  assert.equal(fetchCalls, 8);
});
