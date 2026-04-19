import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEVELOPMENT_FALLBACK_SECRET, getSessionSecret } from '@/lib/auth/session-secret';

test('getSessionSecret uses explicit secret when provided', () => {
  assert.equal(
    getSessionSecret({ NODE_ENV: 'production', SESSION_SECRET: 'super-secret-value' }),
    'super-secret-value',
  );
});

test('getSessionSecret allows development fallback outside production', () => {
  assert.equal(
    getSessionSecret({ NODE_ENV: 'development' }),
    DEVELOPMENT_FALLBACK_SECRET,
  );
});

test('getSessionSecret rejects missing or insecure production secrets', () => {
  assert.throws(
    () => getSessionSecret({ NODE_ENV: 'production' }),
    /SESSION_SECRET_REQUIRED/,
  );

  assert.throws(
    () =>
      getSessionSecret({
        NODE_ENV: 'production',
        SESSION_SECRET: DEVELOPMENT_FALLBACK_SECRET,
      }),
    /SESSION_SECRET_INSECURE/,
  );
});
