import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertOwnershipOrAdmin, AuthError } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';

test('errorResponse preserves AuthError status and message', async () => {
  const response = errorResponse(new AuthError('Forbidden.', 403));

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'Forbidden.' });
});

test('errorResponse maps known auth and registration error codes', async () => {
  const emailInUse = errorResponse(new Error('EMAIL_IN_USE'));
  const invalidCredentials = errorResponse(new Error('INVALID_CREDENTIALS'));
  const ownerNotApproved = errorResponse(new Error('OWNER_NOT_APPROVED'));

  assert.equal(emailInUse.status, 409);
  assert.equal(invalidCredentials.status, 401);
  assert.equal(ownerNotApproved.status, 403);
});

test('errorResponse falls back for generic and non-error values', async () => {
  const genericError = errorResponse(new Error('GENERIC_FAILURE'));
  const unknownValue = errorResponse('unexpected');

  assert.equal(genericError.status, 400);
  assert.deepEqual(await genericError.json(), { error: 'GENERIC_FAILURE' });

  assert.equal(unknownValue.status, 500);
  assert.deepEqual(await unknownValue.json(), { error: 'Unexpected server error.' });
});

test('assertOwnershipOrAdmin allows admin and matching owner, but blocks other owners', () => {
  assert.doesNotThrow(() => {
    assertOwnershipOrAdmin({ id: 'admin-1', role: 'ADMIN' }, 'owner-1');
  });

  assert.doesNotThrow(() => {
    assertOwnershipOrAdmin({ id: 'owner-1', role: 'OWNER' }, 'owner-1');
  });

  assert.throws(
    () => {
      assertOwnershipOrAdmin({ id: 'owner-2', role: 'OWNER' }, 'owner-1');
    },
    (error: unknown) => error instanceof AuthError && error.status === 403,
  );
});
