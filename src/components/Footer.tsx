'use client';

import Link from 'next/link';
import { useSiteContent } from '@/lib/use-site-content';

export default function Footer() {
  const { siteSettings } = useSiteContent();

  return (
    <footer className="mt-6 w-full border-t border-gray-200 bg-white pb-16 md:pb-0">
      <div className="border-b border-gray-200 bg-[#f8f8f8]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-600">
          <Link href="/ad" className="hover:text-gray-900">
            광고문의
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/terms" className="hover:text-gray-900">
            이용약관
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" className="font-bold hover:text-gray-900">
            개인정보처리방침
          </Link>
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
                <span className="ml-0.5 block text-[10px] font-bold text-red-500">#마사지 커뮤니티</span>
              </div>
            </div>

            <div className="text-[12px] leading-relaxed tracking-tight text-gray-500">
              <p>{siteSettings.footerInfo}</p>
              <p className="mt-4">Copyright 2018 {siteSettings.siteName}. 모든 권리 보유.</p>
            </div>
          </div>

          <div className="flex flex-col justify-between md:w-[450px]">
            <div>
              <h3 className="mb-1 text-lg font-bold text-gray-800">고객센터</h3>
              <div className="mb-4 -ml-0.5 text-[32px] font-black leading-none tracking-tight text-[#0078d7]">
                {siteSettings.contactPhone}
              </div>
              <div className="space-y-1.5 text-[12px] font-medium tracking-tight text-gray-500">
                <p>운영 시간: 09:00 - 18:00</p>
                <p>점심 시간: 12:00 - 13:30</p>
                <p>이메일: help@beaulead.co.kr</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
