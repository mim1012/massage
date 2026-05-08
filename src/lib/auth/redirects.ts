import type { UserRole } from '@/lib/types';
import { canAccessPathForRole, getRoleHomeHref } from '@/lib/auth/navigation';

export function getPostLoginRedirect(role: UserRole, redirectTo?: string | null) {
  if (redirectTo && canAccessPathForRole(role, redirectTo)) {
    return redirectTo;
  }

  return role === 'USER' ? '/' : getRoleHomeHref(role);
}
