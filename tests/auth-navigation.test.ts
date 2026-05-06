import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMyHref, getMyLabel } from '../src/lib/auth/navigation';

test('getMyHref routes each role to the expected destination', () => {
  assert.equal(getMyHref('ADMIN'), '/admin');
  assert.equal(getMyHref('OWNER'), '/owner/shops');
  assert.equal(getMyHref('USER'), '/my');
  assert.equal(getMyHref(undefined), '/auth/login');
});

test('getMyLabel renders role-specific my labels', () => {
  assert.equal(getMyLabel('ADMIN'), '관리자');
  assert.equal(getMyLabel('OWNER'), '내업소');
  assert.equal(getMyLabel('USER'), 'MY');
  assert.equal(getMyLabel(undefined), 'MY');
});
