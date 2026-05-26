import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createReviewDeleteResponse,
  normalizePublicReviewPatchInput,
} from '../src/lib/review-route-helpers';

test('normalizePublicReviewPatchInput trims content and keeps valid rating', () => {
  assert.deepEqual(
    normalizePublicReviewPatchInput({ rating: 4, content: '  깔끔한 리뷰  ' }),
    { rating: 4, content: '깔끔한 리뷰' },
  );
});

test('normalizePublicReviewPatchInput rejects blank content', () => {
  assert.throws(
    () => normalizePublicReviewPatchInput({ rating: 4, content: '   ' }),
    /리뷰 내용은 필수입니다\./,
  );
});

test('normalizePublicReviewPatchInput rejects out-of-range ratings', () => {
  assert.throws(
    () => normalizePublicReviewPatchInput({ rating: 6, content: '유효한 내용' }),
    /평점은 1점부터 5점 사이여야 합니다\./,
  );
});

test('createReviewDeleteResponse returns 404 when deletion fails', async () => {
  const response = createReviewDeleteResponse(false);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: '리뷰를 찾을 수 없습니다.' });
});

test('createReviewDeleteResponse returns success payload when deletion succeeds', async () => {
  const response = createReviewDeleteResponse(true);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
});
