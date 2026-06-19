'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { User } from '@/lib/types';

type SessionResponse = {
  user?: User | null;
};

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch(`/api/auth/me?t=${Date.now()}`, { cache: 'no-store', credentials: 'include' });

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setUser(null);
          return;
        }

        const result = (await response.json()) as SessionResponse;
        let fetchedUser = result.user ?? null;
        
        // MOCK/TESTING FALLBACK: admin/layout.tsx 에서는 localStorage를 사용하므로
        // API에서 유저가 없더라도 localStorage에 있으면 로그인 상태로 간주
        if (!fetchedUser) {
          try {
            const stored = localStorage.getItem('auth_user');
            if (stored) {
              const parsed = JSON.parse(stored);
              fetchedUser = {
                ...parsed,
                id: parsed.id || 'mock-id',
                email: parsed.email || 'test@healing.local',
                name: parsed.name || (parsed.role === 'ADMIN' ? '관리자(테스트)' : '사장님(테스트)'),
                role: parsed.role || 'USER',
              };
            }
          } catch {}
        }

        setUser(fetchedUser);
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthChecked(true);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const clearSession = () => {
    setUser(null);
  };

  return { user, authChecked, clearSession };
}
