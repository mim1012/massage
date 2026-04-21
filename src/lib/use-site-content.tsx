'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { MOCK_HOME_SEO, MOCK_SITE_SETTINGS } from '@/lib/mockData';
import type { HomeSeoContent, SiteSettings } from '@/lib/types';

export type SiteContent = {
  siteSettings: SiteSettings;
  homeSeo: HomeSeoContent;
};

const fallbackContent: SiteContent = {
  siteSettings: MOCK_SITE_SETTINGS,
  homeSeo: MOCK_HOME_SEO,
};

const SiteContentContext = createContext<SiteContent>(fallbackContent);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(fallbackContent);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/site-settings', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as Partial<SiteContent>;
        if (!cancelled && result.siteSettings && result.homeSeo) {
          setContent({
            siteSettings: result.siteSettings,
            homeSeo: result.homeSeo,
          });
        }
      } catch {
        return;
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => content, [content]);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
