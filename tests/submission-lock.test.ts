import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSubmissionLock } from '@/lib/client/submission-lock';

test('createSubmissionLock blocks duplicate acquires until released', () => {
  const lock = createSubmissionLock();

  assert.equal(lock.tryAcquire(), true);
  assert.equal(lock.tryAcquire(), false);

  lock.release();

  assert.equal(lock.tryAcquire(), true);
});

test('createSubmissionLock stays locked across synchronous duplicate submits', () => {
  const lock = createSubmissionLock();

  const firstSubmitAllowed = lock.tryAcquire();
  const secondSubmitAllowed = lock.tryAcquire();

  assert.equal(firstSubmitAllowed, true);
  assert.equal(secondSubmitAllowed, false);
});


test('createSubmissionLock remains locked if release is not called after success', () => {
  const lock = createSubmissionLock();

  assert.equal(lock.tryAcquire(), true);
  assert.equal(lock.tryAcquire(), false);
});
