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
        href="/board/notice"
        onClick={onNavigate}
        className={clsx(
          'block w-full cursor-pointer text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5',
          'rounded border-2 border-[var(--portal-blue-banner-border)] bg-[var(--portal-blue-banner)] p-3 text-white hover:bg-[var(--portal-blue-banner-hover)]',
        )}
      >
        <div className="mb-0.5 text-[10px] text-blue-200">건마에반하다</div>
        <div className="mb-1 text-[15px] font-black">광고 안내</div>
        <div className="inline-block rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black">바로가기 &gt;</div>
      </Link>

      <Link
        href="/board/partnership"
        onClick={onNavigate}
        className={clsx(
          'block w-full cursor-pointer text-center text-gray-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5',
          'rounded border-2 border-gray-300 bg-[#f8f9fa] p-3 hover:border-gray-400 hover:bg-white',
        )}
      >
        <div className="mb-0.5 text-[10px] text-gray-500">힐링찾기</div>
        <div className="mb-1 text-[15px] font-black text-[var(--portal-brand)]">입점 문의</div>
        <div className="inline-block rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-white">모집중 &gt;</div>
      </Link>

      <div className="flex h-[150px] flex-col items-center justify-center rounded border border-gray-200 bg-gray-100 text-gray-400">
        <div className="mb-1 text-xl">🎯</div>
        <span className="text-xs font-bold">배너 슬롯</span>
        <span className="text-[10px]">180×150</span>
      </div>
    </div>
  );
}
