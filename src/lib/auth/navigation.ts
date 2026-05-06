import type { UserRole } from '@/lib/types';

export function getMyHref(role?: UserRole) {
  if (role === 'ADMIN') {
    return '/admin';
  }

  if (role === 'OWNER') {
    return '/owner/shops';
  }

  if (role === 'USER') {
    return '/my';
  }

  return '/auth/login';
}

export function getMyLabel(role?: UserRole) {
  if (role === 'ADMIN') {
    return '관리자';
  }

  if (role === 'OWNER') {
    return '내업소';
  }

  return 'MY';
}
