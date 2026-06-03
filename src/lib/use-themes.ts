'use client';

import { useEffect, useState } from 'react';
import { THEMES } from '@/lib/catalog';

export type ThemeOption = { code: string; label: string };

const STATIC_THEMES: ThemeOption[] = THEMES as unknown as ThemeOption[];

export function useThemes(): ThemeOption[] {
  const [themes, setThemes] = useState<ThemeOption[]>(STATIC_THEMES);

  useEffect(() => {
    fetch('/api/themes')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.themes) && data.themes.length > 0) {
          setThemes([
            { code: 'all', label: '전체' },
            ...data.themes.map(({ code, label }: { code: string; label: string }) => ({ code, label })),
          ]);
        }
      })
      .catch(() => {});
  }, []);

  return themes;
}
