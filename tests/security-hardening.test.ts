import assert from 'node:assert/strict';
import { test } from 'node:test';
import nextConfig from '../next.config';
import { getBaselineSecurityHeaders, sessionJsonResponse } from '@/lib/security/http';
import {
  applyRateLimitHeaders,
  buildAuthRateLimitKey,
  checkAuthRateLimit,
  createMemoryRateLimiter,
  getClientIp,
} from '@/lib/security/rate-limit';


test('/api/auth/me responses carry private no-store cache headers', async () => {
  const response = sessionJsonResponse({ user: { id: 'user-1' } });

  assert.equal(response.headers.get('Cache-Control'), 'private, no-store, no-cache, max-age=0, must-revalidate');
  assert.equal(response.headers.get('Pragma'), 'no-cache');
  assert.equal(response.headers.get('Expires'), '0');
  assert.equal(response.headers.get('Vary'), 'Cookie');
  assert.deepEqual(await response.json(), { user: { id: 'user-1' } });
});

test('baseline security headers are applied through Next config', async () => {
  assert.equal(typeof nextConfig.headers, 'function');

  const configuredHeaders = await nextConfig.headers?.();
  const baselineHeaders = getBaselineSecurityHeaders();

  assert.deepEqual(configuredHeaders, [
    {
      source: '/(.*)',
      headers: baselineHeaders,
    },
  ]);

  const headerMap = new Map(baselineHeaders.map((header) => [header.key, header.value]));
  assert.match(headerMap.get('Content-Security-Policy') ?? '', /default-src 'self'/);
  assert.match(headerMap.get('Content-Security-Policy') ?? '', /frame-ancestors 'none'/);
  assert.equal(headerMap.get('X-Frame-Options'), 'DENY');
  assert.equal(headerMap.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(headerMap.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.match(headerMap.get('Permissions-Policy') ?? '', /camera=\(\)/);
});

test('auth rate limiting is keyed by route and client IP and returns 429 after the limit', async () => {
  let currentTime = 1_000;
  const limiter = createMemoryRateLimiter({
    limit: 2,
    windowMs: 10_000,
    now: () => currentTime,
  });

  const request = new Request('https://example.com/api/auth/login', {
    headers: {
      'x-forwarded-for': '203.0.113.10, 10.0.0.1',
    },
  });

  assert.equal(getClientIp(request), '203.0.113.10');
  assert.equal(limiter.check('auth:login:203.0.113.10').limited, false);
  assert.equal(limiter.check('auth:login:203.0.113.10').limited, false);

  const blocked = limiter.check('auth:login:203.0.113.10');
  assert.equal(blocked.limited, true);
  if (!blocked.limited) {
    assert.fail('expected the third request to be rate limited');
  }

  assert.equal(blocked.response.status, 429);
  assert.equal(blocked.response.headers.get('Cache-Control'), 'no-store');
  assert.equal(blocked.response.headers.get('Retry-After'), '10');
  assert.deepEqual(await blocked.response.json(), {
    error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  });

  assert.equal(limiter.check('auth:register:user:203.0.113.10').limited, false);

  currentTime += 10_001;
  assert.equal(limiter.check('auth:login:203.0.113.10').limited, false);
});

test('login rate limit keys normalize credentials and isolate accounts behind the same IP', () => {
  const limiter = createMemoryRateLimiter({ limit: 2, windowMs: 10_000, now: () => 5_000 });
  const request = new Request('https://example.com/api/auth/login', {
    headers: {
      'x-forwarded-for': '203.0.113.10',
    },
  });

  const primaryKey = buildAuthRateLimitKey(request, 'auth:login', {
    credential: ' User@Example.com ',
  });
  const normalizedDuplicateKey = buildAuthRateLimitKey(request, 'auth:login', {
    credential: 'user@example.com',
  });
  const differentAccountKey = buildAuthRateLimitKey(request, 'auth:login', {
    credential: 'other@example.com',
  });

  assert.equal(primaryKey, normalizedDuplicateKey);
  assert.notEqual(primaryKey, differentAccountKey);

  assert.equal(limiter.check(primaryKey).limited, false);
  assert.equal(limiter.check(normalizedDuplicateKey).limited, false);

  const blocked = limiter.check(primaryKey);
  assert.equal(blocked.limited, true);

  assert.equal(limiter.check(differentAccountKey).limited, false);
});

test('login rate limiting applies separate credential and IP ceilings', async () => {
  const request = new Request('https://example.com/api/auth/login', {
    headers: {
      'x-forwarded-for': '203.0.113.10',
    },
  });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(checkAuthRateLimit(request, 'auth:login:credential', { credential: 'user@example.com' }).limited, false);
  }

  const credentialBlocked = checkAuthRateLimit(request, 'auth:login:credential', { credential: 'user@example.com' });
  assert.equal(credentialBlocked.limited, true);
  if (!credentialBlocked.limited) {
    assert.fail('expected the sixth credential attempt to be rate limited');
  }
  assert.equal(credentialBlocked.response.headers.get('X-RateLimit-Limit'), '5');

  for (let attempt = 0; attempt < 30; attempt += 1) {
    assert.equal(checkAuthRateLimit(request, 'auth:login:ip').limited, false);
  }

  const ipBlocked = checkAuthRateLimit(request, 'auth:login:ip');
  assert.equal(ipBlocked.limited, true);
  if (!ipBlocked.limited) {
    assert.fail('expected the thirty-first IP attempt to be rate limited');
  }
  assert.equal(ipBlocked.response.headers.get('X-RateLimit-Limit'), '30');
});

test('applyRateLimitHeaders preserves the response body while merging auth rate-limit headers', async () => {
  const response = applyRateLimitHeaders(
    Response.json({ ok: true }, { status: 201, headers: { 'Content-Type': 'application/json; charset=utf-8' } }),
    new Headers({
      'Cache-Control': 'no-store',
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '9',
      'X-RateLimit-Reset': '123',
    }),
  );

  assert.equal(response.status, 201);
  assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-RateLimit-Limit'), '10');
  assert.equal(response.headers.get('X-RateLimit-Remaining'), '9');
  assert.equal(response.headers.get('X-RateLimit-Reset'), '123');
  assert.deepEqual(await response.json(), { ok: true });
});
