import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INPUT_LIMITS, isNonEmptyString, isWithinLength, normalizeBoundedString } from '@/lib/validation/input';
import { isRecordNotFoundError } from '@/lib/db/retry';

test('isNonEmptyString rejects non-strings and blank strings, accepts real text', () => {
  assert.equal(isNonEmptyString('hello'), true);
  assert.equal(isNonEmptyString('  x  '), true);
  assert.equal(isNonEmptyString(''), false);
  assert.equal(isNonEmptyString('   '), false);
  assert.equal(isNonEmptyString(123), false);
  assert.equal(isNonEmptyString(null), false);
  assert.equal(isNonEmptyString(undefined), false);
  assert.equal(isNonEmptyString({}), false);
  assert.equal(isNonEmptyString(['a']), false);
});

test('isWithinLength enforces the boundary inclusively', () => {
  assert.equal(isWithinLength('abc', 3), true);
  assert.equal(isWithinLength('abcd', 3), false);
  assert.equal(isWithinLength('', 3), true);
});

test('normalizeBoundedString trims valid input and rejects bad or oversized input', () => {
  assert.equal(normalizeBoundedString('  hi  ', 10), 'hi');
  assert.equal(normalizeBoundedString('', 10), null);
  assert.equal(normalizeBoundedString('   ', 10), null);
  assert.equal(normalizeBoundedString(42, 10), null);
  assert.equal(normalizeBoundedString(null, 10), null);
  assert.equal(normalizeBoundedString('x'.repeat(11), 10), null);
  assert.equal(normalizeBoundedString('x'.repeat(10), 10), 'x'.repeat(10));
});

test('INPUT_LIMITS exposes sane caps', () => {
  assert.ok(INPUT_LIMITS.reviewContent >= 500);
  assert.ok(INPUT_LIMITS.searchQuery <= 200);
});

test('isRecordNotFoundError distinguishes Prisma P2025 from infrastructure errors', () => {
  assert.equal(isRecordNotFoundError({ code: 'P2025' }), true);
  assert.equal(isRecordNotFoundError({ code: 'P2024' }), false);
  assert.equal(isRecordNotFoundError(new Error('connection terminated unexpectedly')), false);
  assert.equal(isRecordNotFoundError(null), false);
  assert.equal(isRecordNotFoundError('P2025'), false);
});
