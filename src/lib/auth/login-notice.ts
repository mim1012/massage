export const PENDING_APPROVAL_LOGIN_NOTICE = 'pending-approval';

export function getPendingApprovalLoginHref() {
  return `/auth/login?notice=${PENDING_APPROVAL_LOGIN_NOTICE}`;
}

export function getLoginNotice(notice?: string | null) {
  if (notice === PENDING_APPROVAL_LOGIN_NOTICE) {
    return {
      tone: 'info' as const,
      message: '입점 신청이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.',
    };
  }

  return null;
}
