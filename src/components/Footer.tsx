 'use client';

import Link from 'next/link';
import { useSiteContent } from '@/lib/use-site-content';

export default function Footer() {
  const { siteSettings } = useSiteContent();
  const footerLines = siteSettings.footerInfo
    .split(/\r?\n|\|/u)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <footer className="mt-6 w-full border-t border-gray-200 bg-white pb-16 md:pb-0">
      <div className="border-b border-gray-200 bg-[#f8f8f8]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-600">
          <Link href="/ad" className="hover:text-gray-900">\uad11\uace0\ubb38\uc758</Link>
          <span className="text-gray-300">|</span>
          <Link href="/terms" className="hover:text-gray-900">\uc774\uc6a9\uc57d\uad00</Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" className="font-bold hover:text-gray-900">\uac1c\uc778\uc815\ubcf4\ucc98\ub9ac\ubc29\uce68</Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="flex-1 space-y-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
                <span className="text-sm font-black text-white">{siteSettings.siteName[0]}</span>
              </div>
              <div className="leading-tight">
                <span className="text-xl font-black tracking-tight text-gray-900">{siteSettings.siteName}</span>
                <span className="ml-0.5 block text-[10px] font-bold text-red-500">#{siteSettings.siteDescription}</span>
              </div>
            </div>

            <div className="text-[12px] leading-relaxed tracking-tight text-gray-500">
              {footerLines.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
              <p className={footerLines.length > 0 ? 'mt-4' : undefined}>
                Copyright 2018 {siteSettings.siteName}. \ubaa8\ub4e0 \uad8c\ub9ac \ubcf4\uc720.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between md:w-[450px]">
            <div>
              <h3 className="mb-1 text-lg font-bold text-gray-800">\uace0\uac1d\uc13c\ud130</h3>
              <div className="mb-4 -ml-0.5 text-[32px] font-black leading-none tracking-tight text-[#0078d7]">
                {siteSettings.contactPhone}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
