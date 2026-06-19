'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { User } from '@/lib/types';

type SessionResponse = {
  user?: User | null;
};

async function fetchSessionUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
    if (!response.ok) return null;
    const result = (await response.json()) as SessionResponse;
    return result.user ?? null;
  } catch {
    return null;
  }
}

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const sessionUser = await fetchSessionUser();
      if (cancelled) return;
      setUser(sessionUser);
      setAuthChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const refetch = async () => {
    const sessionUser = await fetchSessionUser();
    setUser(sessionUser);
    setAuthChecked(true);
  };

  const clearSession = () => {
    setUser(null);
    setAuthChecked(true);
  };

  return { user, authChecked, refetch, clearSession };
}
