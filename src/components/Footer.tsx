'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useSiteContent } from '@/lib/use-site-content';

export default function Footer() {
  const { siteSettings } = useSiteContent();

  const socialItems = [
    { label: 'YT', href: '#', className: 'bg-[var(--portal-brand)]' },
    { label: 'IG', href: '#', className: 'bg-[var(--portal-brand-hover)]' },
    { label: 'BL', href: '#', className: 'bg-[var(--portal-blue-banner-hover)]' },
  ];

  return (
    <footer className="mt-6 w-full border-t border-gray-200 bg-white pb-16 md:pb-0">
      <div className="border-b border-gray-200 bg-slate-50">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 text-[13px] font-medium text-slate-600">
          <Link href="/ad" prefetch={false} className="hover:text-[var(--portal-brand)]">광고안내</Link>
          <span className="text-gray-300">|</span>
          <Link href="/terms" prefetch={false} className="hover:text-[var(--portal-brand)]">이용약관</Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" prefetch={false} className="font-bold hover:text-[var(--portal-brand)]">개인정보처리방침</Link>
          <span className="text-gray-300">|</span>
          <Link href="/youth" prefetch={false} className="hover:text-[var(--portal-brand)]">청소년보호정책</Link>
          <span className="text-gray-300">|</span>
          <Link href="/mobile" prefetch={false} className="hover:text-[var(--portal-brand)]">모바일웹</Link>
          <span className="text-gray-300">|</span>
          <Link href="/rss" prefetch={false} className="rounded-sm bg-[var(--portal-brand)] px-1.5 py-0.5 text-[11px] text-white hover:opacity-80">RSS</Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="flex-1 space-y-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--portal-brand)]">
                <span className="text-sm font-black text-white">{siteSettings.siteName[0]}</span>
              </div>
              <div className="leading-tight">
                <span className="text-xl font-black tracking-tight text-gray-900">{siteSettings.siteName}</span>
                <span className="ml-0.5 block -mt-1 text-[10px] font-bold text-[var(--portal-brand)]">ENTERPRISE DIRECTORY</span>
              </div>
            </div>

            <div className="text-[12px] font-medium leading-relaxed text-gray-500">
              <p>{siteSettings.footerInfo}</p>
              <p className="mt-4 font-normal">Copyright © 2026 {siteSettings.siteName}. All rights reserved.</p>
            </div>
          </div>

          <div className="flex flex-col justify-between md:w-[450px]">
            <div>
              <h3 className="mb-1 text-lg font-bold text-slate-800">고객센터</h3>
              <div className="-ml-0.5 mb-4 text-[32px] font-black leading-none tracking-tight text-[var(--portal-brand)]">
                {siteSettings.contactPhone}
              </div>
              <div className="space-y-1.5 text-[12px] font-medium tracking-tight text-slate-500">
                <p>평일 : 월~금 09:00 ~ 18:00</p>
                <p>점심시간 : 12:00 ~ 13:30 (주말, 공휴일 휴무)</p>
                <p>E-MAIL : help@healing.co.kr</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {socialItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  prefetch={false}
                  className={clsx('flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white transition-opacity hover:opacity-80', item.className)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
