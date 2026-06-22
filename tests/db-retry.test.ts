import assert from 'node:assert/strict';
import test from 'node:test';
import { isTransientDatabaseError, withDatabaseRetry } from '@/lib/db/retry';

test('isTransientDatabaseError recognizes connection-pool exhaustion failures', () => {
  assert.equal(isTransientDatabaseError(new Error('EMAXCONNSESSION max clients reached in session mode')), true);
  assert.equal(isTransientDatabaseError(new Error('timeout exceeded when trying to connect')), true);
  assert.equal(isTransientDatabaseError(new Error('simulated validation error')), false);
});

test('withDatabaseRetry retries transient failures before succeeding', async () => {
  let attempts = 0;
  const result = await withDatabaseRetry(async () => {
    attempts += 1;
    if (attempts < 3) {
      throw new Error('timeout exceeded when trying to connect');
    }

    return 'ok';
  });

  assert.equal(result, 'ok');
  assert.equal(attempts, 3);
});

test('withDatabaseRetry does not retry non-transient failures', async () => {
  let attempts = 0;

  await assert.rejects(
    () =>
      withDatabaseRetry(async () => {
        attempts += 1;
        throw new Error('validation failed');
      }),
    /validation failed/,
  );

  assert.equal(attempts, 1);
});
