'use client';

import { useEffect, useState } from 'react';
import { THEMES } from '@/lib/catalog';

export type ThemeOption = { code: string; label: string };

const STATIC_THEMES: ThemeOption[] = THEMES as unknown as ThemeOption[];
let cachedThemes: ThemeOption[] | null = null;
let themeFetchPromise: Promise<ThemeOption[] | null> | null = null;

export function useThemes(): ThemeOption[] {
  const [themes, setThemes] = useState<ThemeOption[]>(cachedThemes ?? STATIC_THEMES);

  useEffect(() => {
    let cancelled = false;

    const loadThemes = async () => {
      const nextThemes = await resolveThemes();
      if (!cancelled && nextThemes) {
        setThemes(nextThemes);
      }
    };

    const resolveThemes = async () => {
      if (cachedThemes) {
        return cachedThemes;
      }

      if (!themeFetchPromise) {
        themeFetchPromise = (async () => {
          try {
            const response = await fetch('/api/themes', { cache: 'force-cache' });
            if (!response.ok) {
              return null;
            }

            const data = (await response.json()) as {
              themes?: Array<{ code: string; label: string }>;
            };
            if (!Array.isArray(data.themes) || data.themes.length === 0) {
              return null;
            }

            const nextThemes = [
              { code: 'all', label: '전체' },
              ...data.themes.map(({ code, label }) => ({ code, label })),
            ];
            cachedThemes = nextThemes;
            return nextThemes;
          } catch {
            return null;
          } finally {
            themeFetchPromise = null;
          }
        })();
      }

      return themeFetchPromise;
    };


    if (typeof window.requestIdleCallback === 'function') {
      const idleHandle = window.requestIdleCallback(() => {
        void loadThemes();
      }, { timeout: 2500 });

      return () => {
        cancelled = true;
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleHandle);
        }
      };
    }

    const timeoutId = window.setTimeout(() => {
      void loadThemes();
    }, 1800);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return themes;
}
