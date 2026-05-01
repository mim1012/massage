import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPostLoginRedirect } from '@/lib/auth/redirects';

test('getPostLoginRedirect routes admins to admin area', () => {
  assert.equal(getPostLoginRedirect('ADMIN', '/admin/approvals'), '/admin/approvals');
  assert.equal(getPostLoginRedirect('ADMIN', '/owner/shops'), '/admin');
});

test('getPostLoginRedirect routes owners to owner area', () => {
  assert.equal(getPostLoginRedirect('OWNER', '/owner/shops/new'), '/owner/shops/new');
  assert.equal(getPostLoginRedirect('OWNER', '/admin/shops'), '/owner/shops');
});

test('getPostLoginRedirect blocks non-user redirects for general users', () => {
  assert.equal(getPostLoginRedirect('USER', '/shop/test-shop'), '/shop/test-shop');
  assert.equal(getPostLoginRedirect('USER', '/admin/shops'), '/');
  assert.equal(getPostLoginRedirect('USER', '/owner/shops'), '/');
});
