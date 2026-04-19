import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

test('hashPassword salts output and verifyPassword accepts only the original password', () => {
  const firstHash = hashPassword('secret-123');
  const secondHash = hashPassword('secret-123');

  assert.notEqual(firstHash, secondHash);
  assert.equal(verifyPassword('secret-123', firstHash), true);
  assert.equal(verifyPassword('wrong-password', firstHash), false);
});

test('verifyPassword rejects malformed hashes', () => {
  assert.equal(verifyPassword('secret-123', 'missing-separator'), false);
  assert.equal(verifyPassword('secret-123', 'salt:not-hex'), false);
});
