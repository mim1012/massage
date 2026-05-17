import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLoginNotice, getPendingApprovalLoginHref, OWNER_PENDING_APPROVAL_ERROR } from '../src/lib/auth/login-notice';

test('getPendingApprovalLoginHref points owners at login with the approval notice context', () => {
  assert.equal(getPendingApprovalLoginHref(), '/auth/login?notice=pending-approval');
});

test('getLoginNotice returns the owner approval guidance for pending-approval notice', () => {
  assert.deepEqual(getLoginNotice('pending-approval'), {
    tone: 'info',
    message: '입점 신청이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.',
  });
});

test('getLoginNotice also returns the approval guidance for the owner-not-approved login error', () => {
  assert.deepEqual(getLoginNotice(undefined, OWNER_PENDING_APPROVAL_ERROR), {
    tone: 'info',
    message: '입점 신청이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.',
  });
});

test('getLoginNotice ignores unknown notice values', () => {
  assert.equal(getLoginNotice('something-else'), null);
  assert.equal(getLoginNotice(undefined), null);
});
