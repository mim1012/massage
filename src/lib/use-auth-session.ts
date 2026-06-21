'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';

type SessionResponse = {
  user?: User | null;
};

type UseAuthSessionOptions = {
  defer?: boolean;
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

export function useAuthSession(options: UseAuthSessionOptions = {}) {
  const { defer = false } = options;
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSession = () => {
      void (async () => {
        const sessionUser = await fetchSessionUser();
        if (cancelled) return;
        setUser(sessionUser);
        setAuthChecked(true);
      })();
    };

    if (!defer) {
      loadSession();
      return () => {
        cancelled = true;
      };
    }

    if (typeof window.requestIdleCallback === 'function') {
      const idleHandle = window.requestIdleCallback(loadSession, { timeout: 2000 });
      return () => {
        cancelled = true;
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleHandle);
        }
      };
    }

    const timeoutId = window.setTimeout(loadSession, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [defer]);

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
