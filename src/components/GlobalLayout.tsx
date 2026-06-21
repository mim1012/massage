'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import PageViewTracker from './PageViewTracker';
import AdultVerificationBarrier from '@/components/public/AdultVerificationBarrier';
import { SiteContentProvider, type SiteContent } from '@/lib/use-site-content';

export default function GlobalLayout({
  children,
  initialSiteContent,
}: {
  children: React.ReactNode;
  initialSiteContent: SiteContent;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const bypassAgeGate = pathname
    ? ['/auth', '/youth', '/privacy', '/terms', '/mobile'].some((route) =>
        pathname.startsWith(route),
      )
    : false;

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <SiteContentProvider initialContent={initialSiteContent}>
      {bypassAgeGate ? null : <AdultVerificationBarrier />}
      <Suspense fallback={<div className="h-14 bg-white border-b-2 border-[var(--portal-brand)]"></div>}>
        <Header />
      </Suspense>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
    </SiteContentProvider>
  );
}
