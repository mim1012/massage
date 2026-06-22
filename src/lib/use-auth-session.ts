'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';

type SessionResponse = {
  user?: User | null;
};

type UseAuthSessionOptions = {
  defer?: boolean;
};

type SessionFetchResult =
  | {
      ok: true;
      user: User | null;
    }
  | {
      ok: false;
    };

async function fetchSessionUser(): Promise<SessionFetchResult> {
  try {
    const response = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
    if (response.status >= 500) {
      return { ok: false };
    }

    if (!response.ok) {
      return { ok: true, user: null };
    }

    const result = (await response.json()) as SessionResponse;
    return { ok: true, user: result.user ?? null };
  } catch {
    return { ok: false };
  }
}

export function useAuthSession(options: UseAuthSessionOptions = {}) {
  const { defer = false } = options;
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const retryTimers = new Set<number>();

    const clearRetryTimer = (timerId: number) => {
      retryTimers.delete(timerId);
      window.clearTimeout(timerId);
    };

    const loadSession = (attempt: number) => {
      void (async () => {
        const sessionResult = await fetchSessionUser();
        if (cancelled) return;

        if (sessionResult.ok) {
          setUser(sessionResult.user);
          setAuthChecked(true);
          return;
        }

        if (attempt < 1) {
          const retryTimer = window.setTimeout(() => {
            clearRetryTimer(retryTimer);
            if (!cancelled) {
              loadSession(attempt + 1);
            }
          }, 400);
          retryTimers.add(retryTimer);
          return;
        }

        setAuthChecked(true);
      })();
    };

    if (!defer) {
      loadSession(0);
      return () => {
        cancelled = true;
        retryTimers.forEach((timerId) => window.clearTimeout(timerId));
        retryTimers.clear();
      };
    }

    if (typeof window.requestIdleCallback === 'function') {
      const idleHandle = window.requestIdleCallback(() => loadSession(0), { timeout: 2000 });
      return () => {
        cancelled = true;
        retryTimers.forEach((timerId) => window.clearTimeout(timerId));
        retryTimers.clear();
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleHandle);
        }
      };
    }

    const timeoutId = window.setTimeout(() => loadSession(0), 1200);
    return () => {
      cancelled = true;
      retryTimers.forEach((timerId) => window.clearTimeout(timerId));
      retryTimers.clear();
      window.clearTimeout(timeoutId);
    };
  }, [defer]);

  const refetch = async () => {
    const sessionResult = await fetchSessionUser();
    if (sessionResult.ok) {
      setUser(sessionResult.user);
    }
    setAuthChecked(true);
    return sessionResult.ok;
  };

  const clearSession = () => {
    setUser(null);
    setAuthChecked(true);
  };

  return { user, authChecked, refetch, clearSession };
}
