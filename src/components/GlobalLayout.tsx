'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import PageViewTracker from './PageViewTracker';
import AgeVerificationGate from './AgeVerificationGate';
import { SiteContentProvider } from '@/lib/use-site-content';

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const shouldBypassAgeGate = isAdmin || ['/youth', '/privacy', '/terms', '/mobile'].some((route) => pathname?.startsWith(route));
  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <SiteContentProvider>
      {shouldBypassAgeGate ? null : <AgeVerificationGate />}
      <Suspense fallback={<div className="h-14 bg-white border-b-2 border-[#D4A373]"></div>}>
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
