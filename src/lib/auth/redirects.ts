import type { UserRole } from '@/lib/types';
import { canAccessPathForRole, getRoleHomeHref } from '@/lib/auth/navigation';

export function getPostLoginRedirect(role: UserRole, redirectTo?: string | null) {
  if (redirectTo && canAccessPathForRole(role, redirectTo)) {
    return redirectTo;
  }

  if (role === 'OWNER') {
    return getRoleHomeHref(role);
  }

  // ADMIN and USER default to home page
  return '/';
}
