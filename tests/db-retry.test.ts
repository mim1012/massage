import assert from 'node:assert/strict';
import test from 'node:test';
import { isTransientDatabaseError, summarizeDatabaseError, withDatabaseRetry } from '@/lib/db/retry';

test('isTransientDatabaseError recognizes direct and nested transient database failures', () => {
  assert.equal(isTransientDatabaseError(new Error('EMAXCONNSESSION max clients reached in session mode')), true);
  assert.equal(isTransientDatabaseError(new Error('timeout exceeded when trying to connect')), true);
  assert.equal(
    isTransientDatabaseError({
      name: 'PrismaClientKnownRequestError',
      message: 'Connector error',
      code: 'P2024',
      cause: new Error('Timed out fetching a new connection from the connection pool.'),
    }),
    true,
  );
  assert.equal(isTransientDatabaseError(new Error('simulated validation error')), false);
});

test('summarizeDatabaseError flattens nested transient metadata', () => {
  const summary = summarizeDatabaseError({
    name: 'PrismaClientKnownRequestError',
    message: 'Connector error',
    code: 'P2024',
    cause: new Error('Timed out fetching a new connection from the connection pool.'),
  });

  assert.match(summary, /PrismaClientKnownRequestError/);
  assert.match(summary, /Connector error/);
  assert.match(summary, /P2024/);
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

test('withDatabaseRetry retries nested transient failures before succeeding', async () => {
  let attempts = 0;
  const result = await withDatabaseRetry(async () => {
    attempts += 1;
    if (attempts < 2) {
      throw {
        name: 'PrismaClientKnownRequestError',
        message: 'Connector error',
        code: 'P2024',
        cause: new Error('Timed out fetching a new connection from the connection pool.'),
      };
    }

    return 'ok';
  });

  assert.equal(result, 'ok');
  assert.equal(attempts, 2);
});

test('withDatabaseRetry logs transient retries and terminal transient failures', async () => {
  const warnings: string[] = [];
  const errors: string[] = [];
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (message?: unknown, ...args: unknown[]) => {
    warnings.push([message, ...args].join(' '));
  };
  console.error = (message?: unknown, ...args: unknown[]) => {
    errors.push([message, ...args].join(' '));
  };

  try {
    let attempts = 0;
    await assert.rejects(
      () =>
        withDatabaseRetry(
          async () => {
            attempts += 1;
            throw new Error('timeout exceeded when trying to connect');
          },
          2,
          'register user',
        ),
      /timeout exceeded when trying to connect/,
    );

    assert.equal(attempts, 2);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0] ?? '', /register user transient failure on attempt 1\/2/);
    assert.equal(errors.length, 1);
    assert.match(errors[0] ?? '', /register user failed after 2 attempts/);
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
  }
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
