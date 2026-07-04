import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertOwnershipOrAdmin, AuthError } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';

test('errorResponse preserves AuthError status and localizes known messages', async () => {
  const response = errorResponse(new AuthError('Forbidden.', 403));

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: '접근 권한이 없습니다.' });
});

test('errorResponse maps known auth and registration error codes', async () => {
  const emailInUse = errorResponse(new Error('EMAIL_IN_USE'));
  const invalidCredentials = errorResponse(new Error('INVALID_CREDENTIALS'));
  const ownerNotApproved = errorResponse(new Error('OWNER_NOT_APPROVED'));
  const slugInUse = errorResponse(new Error('Unique constraint failed on the fields: (`slug`)'));

  assert.equal(emailInUse.status, 409);
  assert.equal(invalidCredentials.status, 401);
  assert.equal(ownerNotApproved.status, 403);
  assert.equal(slugInUse.status, 409);
  assert.deepEqual(await slugInUse.json(), {
    error: '이미 사용 중인 슬러그입니다. 다른 URL 영문명을 입력해 주세요.',
  });
});

test('errorResponse hides unmapped internal messages and passes Korean user messages through', async () => {
  const internalError = errorResponse(new Error('GENERIC_FAILURE'));
  const prismaLikeError = errorResponse(new Error('Invalid `prisma.shop.findMany()` invocation'));
  const koreanValidationError = errorResponse(new Error('평점은 1점부터 5점 사이여야 합니다.'));
  const unknownValue = errorResponse('unexpected');

  assert.equal(internalError.status, 500);
  assert.deepEqual(await internalError.json(), { error: '예상하지 못한 서버 오류가 발생했습니다.' });

  assert.equal(prismaLikeError.status, 500);
  assert.deepEqual(await prismaLikeError.json(), { error: '예상하지 못한 서버 오류가 발생했습니다.' });

  assert.equal(koreanValidationError.status, 400);
  assert.deepEqual(await koreanValidationError.json(), { error: '평점은 1점부터 5점 사이여야 합니다.' });

  assert.equal(unknownValue.status, 500);
  assert.deepEqual(await unknownValue.json(), { error: '예상하지 못한 서버 오류가 발생했습니다.' });
});

test('errorResponse treats malformed JSON bodies as a client error without leaking parser details', async () => {
  const malformedJsonError = errorResponse(new SyntaxError('Unexpected end of JSON input'));

  assert.equal(malformedJsonError.status, 400);
  assert.deepEqual(await malformedJsonError.json(), { error: '요청 형식이 올바르지 않습니다.' });
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
