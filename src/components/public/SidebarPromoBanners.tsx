'use client';

import Link from 'next/link';
import clsx from 'clsx';

type SidebarPromoBannersProps = {
  mode?: 'sidebar' | 'inline';
  onNavigate?: () => void;
};

export default function SidebarPromoBanners({ mode = 'sidebar', onNavigate }: SidebarPromoBannersProps) {
  const isSidebar = mode === 'sidebar';

  return (
    <div className={clsx('space-y-2', isSidebar ? 'mt-4' : '')}>
      <Link
        href="/ad"
        prefetch={false}
        onClick={onNavigate}
        className={clsx(
          'block w-full cursor-pointer text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5',
          'rounded border-2 border-[var(--portal-blue-banner-border)] bg-[var(--portal-blue-banner)] p-3 text-white hover:bg-[var(--portal-blue-banner-hover)]',
        )}
      >
        <div className="mb-0.5 text-[10px] text-white/75">건마에반하다</div>
        <div className="mb-1 text-[15px] font-black">광고 안내</div>
        <div className="inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[var(--portal-brand-dark)]">바로가기 &gt;</div>
      </Link>

      <Link
        href="/board/partnership"
        prefetch={false}
        onClick={onNavigate}
        className={clsx(
          'block w-full cursor-pointer text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5',
          'rounded border-2 border-[var(--portal-brand-hover)] bg-gradient-to-br from-white to-[var(--portal-brand-soft)] p-3 hover:bg-white',
        )}
      >
        <div className="mb-0.5 text-[10px] font-bold text-[var(--portal-brand-dark)] opacity-70">BUSINESS PARTNER</div>
        <div className="mb-1 text-[16px] font-black text-[var(--portal-brand-dark)]">제휴 입점 문의</div>
        <div className="inline-block rounded-full bg-[var(--portal-brand)] px-3 py-0.5 text-[10px] font-black text-white">상담 신청하기 &gt;</div>
      </Link>

      <div className="flex h-[150px] flex-col items-center justify-center rounded border border-[var(--color-border)] bg-[var(--portal-brand-soft)] text-[var(--color-text-secondary)]">
        <div className="mb-1 text-xl">🎯</div>
        <span className="text-xs font-bold">배너 슬롯</span>
        <span className="text-[10px]">180×150</span>
      </div>
    </div>
  );
}
