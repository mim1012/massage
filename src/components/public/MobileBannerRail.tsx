'use client';

import Link from 'next/link';

export default function MobileBannerRail() {
  return (
    <section className="mobile-banner-rail mb-4 lg:hidden" aria-label="광고 및 빠른 메뉴">
      <Link
        href="/board/partnership"
        className="mobile-banner-card mobile-premium-center"
      >
        <div className="bg-pink-500 py-1 text-center text-[11px] font-black text-white">프리미엄 입점센터</div>
        <div className="p-3 text-center text-white">
          <div className="text-[10px] text-blue-200">전국 제휴업소</div>
          <div className="mt-1 text-lg font-black leading-tight">선착순 모집중</div>
        </div>
      </Link>

      <Link href="/board/notice" className="mobile-banner-card mobile-ad-guide">
        <div className="mb-0.5 text-[10px] text-blue-200">건마에반하다</div>
        <div className="mb-1 text-[15px] font-black">광고 안내</div>
        <div className="inline-block rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black">바로가기 &gt;</div>
      </Link>

      <Link href="/board/partnership" className="mobile-banner-card mobile-partnership">
        <div className="mb-0.5 text-[10px] text-gray-500">힐링찾기</div>
        <div className="mb-1 text-[15px] font-black text-[var(--portal-brand)]">입점 문의</div>
        <div className="inline-block rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-white">모집중 &gt;</div>
      </Link>

      <div className="mobile-banner-card mobile-empty-slot">
        <div className="mb-1 text-xl">🎯</div>
        <span className="text-xs font-bold">배너 슬롯</span>
        <span className="text-[10px]">180×150</span>
      </div>
    </section>
  );
}
