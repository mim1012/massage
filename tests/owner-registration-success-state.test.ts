import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getOwnerRegistrationSuccessState } from '../src/lib/auth/owner-registration';

test('getOwnerRegistrationSuccessState falls back to the approval-needed login message', () => {
  assert.deepEqual(getOwnerRegistrationSuccessState({}), {
    message: '관리자 승인 후 로그인할 수 있습니다.',
    nextUrl: '/auth/login',
    requiresApproval: true,
  });
});

test('getOwnerRegistrationSuccessState preserves explicit API fields', () => {
  assert.deepEqual(
    getOwnerRegistrationSuccessState({
      message: '승인 완료 후 이용 가능합니다.',
      nextUrl: '/custom-login',
      requiresApproval: true,
    }),
    {
      message: '승인 완료 후 이용 가능합니다.',
      nextUrl: '/custom-login',
      requiresApproval: true,
    },
  );
});
