import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldTrackPath } from '@/lib/analytics';

test('shouldTrackPath skips auth and admin shells while keeping public browse routes', () => {
  assert.equal(shouldTrackPath('/'), true);
  assert.equal(shouldTrackPath('/shop/sample-shop'), true);
  assert.equal(shouldTrackPath('/board'), true);
  assert.equal(shouldTrackPath('/top100'), true);
  assert.equal(shouldTrackPath('/auth/login'), false);
  assert.equal(shouldTrackPath('/auth/register'), false);
  assert.equal(shouldTrackPath('/admin'), false);
  assert.equal(shouldTrackPath('/api/auth/me'), false);
});
