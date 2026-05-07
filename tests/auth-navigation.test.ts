import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canAccessPathForRole, getMyHref, getMyLabel, getRoleHomeHref, isOwnerAreaRole, ROLE_HOME_PATH } from '../src/lib/auth/navigation';

test('ROLE_HOME_PATH and getRoleHomeHref stay aligned for each role', () => {
  assert.equal(ROLE_HOME_PATH.ADMIN, '/admin');
  assert.equal(ROLE_HOME_PATH.OWNER, '/owner/shops');
  assert.equal(ROLE_HOME_PATH.USER, '/my');

  assert.equal(getRoleHomeHref('ADMIN'), ROLE_HOME_PATH.ADMIN);
  assert.equal(getRoleHomeHref('OWNER'), ROLE_HOME_PATH.OWNER);
  assert.equal(getRoleHomeHref('USER'), ROLE_HOME_PATH.USER);
  assert.equal(getRoleHomeHref(undefined), '/auth/login');
});

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

test('owner area access policy stays centralized', () => {
  assert.equal(isOwnerAreaRole('ADMIN'), true);
  assert.equal(isOwnerAreaRole('OWNER'), true);
  assert.equal(isOwnerAreaRole('USER'), false);
  assert.equal(isOwnerAreaRole(undefined), false);

  assert.equal(canAccessPathForRole('ADMIN', '/admin/shops'), true);
  assert.equal(canAccessPathForRole('ADMIN', '/owner/shops'), true);
  assert.equal(canAccessPathForRole('OWNER', '/owner/reviews'), true);
  assert.equal(canAccessPathForRole('OWNER', '/admin/shops'), false);
  assert.equal(canAccessPathForRole('USER', '/owner/shops'), false);
  assert.equal(canAccessPathForRole('USER', '/shop/test-shop'), true);
});
