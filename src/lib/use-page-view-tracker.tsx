'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { type PageViewPayload, shouldTrackPath } from '@/lib/analytics';

function sendPageView(payload: PageViewPayload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics/page-view', blob);
    return;
  }

  void fetch('/api/analytics/page-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
}

export function usePageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    if (!shouldTrackPath(pathname) || lastTrackedRef.current === path) {
      return;
    }

    lastTrackedRef.current = path;
    sendPageView({
      path,
      referrer: document.referrer || undefined,
    });
  }, [pathname, searchParams]);
}
