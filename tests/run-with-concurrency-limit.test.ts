import assert from 'node:assert/strict';
import test from 'node:test';
import { runWithConcurrencyLimit } from '@/lib/async/run-with-concurrency-limit';

test('runWithConcurrencyLimit preserves task order while respecting the concurrency ceiling', async () => {
  let active = 0;
  let maxActive = 0;

  const results = await runWithConcurrencyLimit(
    [30, 10, 20, 5].map((delay, index) => async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, delay));
      active -= 1;
      return `task-${index}`;
    }),
    2,
  );

  assert.deepEqual(results, ['task-0', 'task-1', 'task-2', 'task-3']);
  assert.equal(maxActive <= 2, true);
});

test('runWithConcurrencyLimit treats invalid concurrency as one worker', async () => {
  const order: number[] = [];

  const results = await runWithConcurrencyLimit(
    [1, 2, 3].map((value) => async () => {
      order.push(value);
      return value;
    }),
    0,
  );

  assert.deepEqual(results, [1, 2, 3]);
  assert.deepEqual(order, [1, 2, 3]);
});
