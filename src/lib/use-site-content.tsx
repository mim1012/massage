'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
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

export function SiteContentProvider({
  children,
  initialContent,
}: {
  children: ReactNode;
  initialContent?: SiteContent;
}) {
  const value = useMemo(() => initialContent ?? fallbackContent, [initialContent]);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
