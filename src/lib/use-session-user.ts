'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';

export function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const result = (await response.json()) as { user?: User | null };

        if (!cancelled) {
          setUser(response.ok ? (result.user ?? null) : null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return user;
}
