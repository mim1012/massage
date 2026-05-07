'use client';

import Link from 'next/link';

export default function MobileBannerRail() {
  return (
    <div className="mt-6 grid gap-3 md:hidden">
      <Link
        href="/board/partnership"
        prefetch={false}
        className="group block cursor-pointer overflow-hidden rounded-lg border-2 border-[var(--portal-blue-banner-border)] bg-gradient-to-b from-[var(--portal-blue-banner-hover)] to-[var(--portal-brand-dark)] text-white shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="bg-[var(--portal-brand)] py-1 text-center text-[11px] font-black text-white">프리미엄 입점센터</div>
        <div className="p-3 text-center">
          <div className="text-[10px] text-white/75">전국 제휴업소</div>
          <div className="mt-1 text-base font-black leading-tight transition-transform group-hover:scale-[1.02]">
            선착순 모집중
          </div>
        </div>
      </Link>

      <Link
        href="/board/notice"
        prefetch={false}
        className="block w-full cursor-pointer rounded border-2 border-[var(--portal-blue-banner-border)] bg-[var(--portal-blue-banner)] p-3 text-center text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--portal-blue-banner-hover)]"
      >
        <div className="mb-0.5 text-[10px] text-white/75">건마에반하다</div>
        <div className="mb-1 text-[15px] font-black">광고 안내</div>
        <div className="inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[var(--portal-brand-dark)]">바로가기 &gt;</div>
      </Link>

      <Link
        href="/board/partnership"
        prefetch={false}
        className="block w-full cursor-pointer rounded border-2 border-[var(--color-border)] bg-[var(--portal-brand-soft)] p-3 text-center text-gray-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--portal-blue-banner-border)] hover:bg-white"
      >
        <div className="mb-0.5 text-[10px] text-gray-500">힐링찾기</div>
        <div className="mb-1 text-[15px] font-black text-[var(--portal-brand)]">입점 문의</div>
        <div className="inline-block rounded-full bg-[var(--portal-gnb)] px-2 py-0.5 text-[10px] font-bold text-white">모집중 &gt;</div>
      </Link>

      <div className="flex h-[96px] flex-col items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--portal-brand-soft)] text-[var(--color-text-secondary)] shadow-sm">
        <div className="mb-1 text-xl">🎯</div>
        <span className="text-xs font-bold">배너 슬롯</span>
        <span className="text-[10px]">모바일 하단 영역</span>
      </div>
    </div>
  );
}
