import type { UserRole } from '@/lib/types';

export function getPostLoginRedirect(role: UserRole, redirectTo?: string | null) {
  if (role === 'ADMIN') {
    return redirectTo?.startsWith('/admin') ? redirectTo : '/admin';
  }

  if (role === 'OWNER') {
    return redirectTo?.startsWith('/owner') ? redirectTo : '/owner/shops';
  }

  if (redirectTo && !redirectTo.startsWith('/admin') && !redirectTo.startsWith('/owner')) {
    return redirectTo;
  }

  return '/';
}
