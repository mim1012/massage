'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';

type SessionResponse = {
  user?: User | null;
};

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setUser(null);
          return;
        }

        const result = (await response.json()) as SessionResponse;
        setUser(result.user ?? null);
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
  }, []);

  return { user, authChecked };
}
