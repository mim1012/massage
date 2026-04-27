import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPaginationRange, getTotalPages, normalizePageParam, paginateItems } from '@/lib/pagination';

test('normalizePageParam falls back to 1 for invalid values', () => {
  assert.equal(normalizePageParam(undefined), 1);
  assert.equal(normalizePageParam('0'), 1);
  assert.equal(normalizePageParam('-3'), 1);
  assert.equal(normalizePageParam('abc'), 1);
  assert.equal(normalizePageParam('4'), 4);
});

test('paginateItems slices the requested page and clamps overflows', () => {
  const items = Array.from({ length: 23 }, (_, index) => index + 1);

  assert.deepEqual(paginateItems(items, 1, 10), items.slice(0, 10));
  assert.deepEqual(paginateItems(items, 2, 10), items.slice(10, 20));
  assert.deepEqual(paginateItems(items, 3, 10), items.slice(20, 30));
  assert.deepEqual(paginateItems(items, 99, 10), items.slice(20, 30));
});

test('getTotalPages rounds up and never returns less than 1', () => {
  assert.equal(getTotalPages(0, 10), 1);
  assert.equal(getTotalPages(1, 10), 1);
  assert.equal(getTotalPages(10, 10), 1);
  assert.equal(getTotalPages(11, 10), 2);
  assert.equal(getTotalPages(23, 10), 3);
});

test('getPaginationRange centers around current page when possible', () => {
  assert.deepEqual(getPaginationRange(1, 1), [1]);
  assert.deepEqual(getPaginationRange(1, 3), [1, 2, 3]);
  assert.deepEqual(getPaginationRange(5, 10), [3, 4, 5, 6, 7]);
  assert.deepEqual(getPaginationRange(9, 10), [6, 7, 8, 9, 10]);
});
