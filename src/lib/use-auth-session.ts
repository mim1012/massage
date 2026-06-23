'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import type { User } from '@/lib/types';

export const AUTH_SESSION_STORAGE_KEY = 'massage.auth.user';
const AUTH_SESSION_EVENT = 'massage:auth-session-changed';

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

let inFlightSessionFetch: Promise<SessionFetchResult> | null = null;


const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function readStoredSessionUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as User;
    return parsed && typeof parsed === 'object' && typeof parsed.id === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function persistSessionUser(user: User | null) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (user) {
      window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
      return;
    }

    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage quota / privacy mode errors.
  }
}

function emitSessionChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function storeSessionUser(user: User | null) {
  persistSessionUser(user);
  emitSessionChange();
}

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

function fetchSharedSessionUser() {
  if (inFlightSessionFetch) {
    return inFlightSessionFetch;
  }

  const pending = fetchSessionUser().finally(() => {
    if (inFlightSessionFetch === pending) {
      inFlightSessionFetch = null;
    }
  });

  inFlightSessionFetch = pending;
  return pending;
}

export function useAuthSession(options: UseAuthSessionOptions = {}) {
  const { defer = false } = options;
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useBrowserLayoutEffect(() => {
    const storedUser = readStoredSessionUser();
    if (!storedUser) {
      return;
    }

    setUser(storedUser);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    const applyStoredSession = () => {
      const storedUser = readStoredSessionUser();
      setUser(storedUser);
      setAuthChecked(Boolean(storedUser) || authChecked);
    };

    window.addEventListener(AUTH_SESSION_EVENT, applyStoredSession);
    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, applyStoredSession);
    };
  }, [authChecked]);

  useEffect(() => {
    let cancelled = false;
    const retryTimers = new Set<number>();

    const clearRetryTimer = (timerId: number) => {
      retryTimers.delete(timerId);
      window.clearTimeout(timerId);
    };

    const loadSession = (attempt: number) => {
      void (async () => {
        const sessionResult = await fetchSharedSessionUser();
        if (cancelled) return;

        if (sessionResult.ok) {
          persistSessionUser(sessionResult.user);
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
    const sessionResult = await fetchSharedSessionUser();
    if (sessionResult.ok) {
      persistSessionUser(sessionResult.user);
      setUser(sessionResult.user);
    }
    setAuthChecked(true);
    return sessionResult.ok;
  };

  const clearSession = () => {
    persistSessionUser(null);
    emitSessionChange();
    setUser(null);
    setAuthChecked(true);
  };

  return { user, authChecked, refetch, clearSession };
}
