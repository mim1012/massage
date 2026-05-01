'use client';

import Link from 'next/link';
import { buildBrowseHref } from '@/lib/directory-mode';

type HomeUtilityRailProps = {
  mode: 'sidebar' | 'inline';
  directoryMode?: 'region' | 'theme';
};

export default function HomeUtilityRail({ mode, directoryMode = 'region' }: HomeUtilityRailProps) {
  const isSidebar = mode === 'sidebar';

  return (
    <div className={isSidebar ? 'sticky top-[170px] relative z-10 space-y-2' : 'space-y-3'}>
      <Link
        href="/board/partnership"
        className="group block cursor-pointer overflow-hidden rounded-lg border-2 border-blue-600 bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="animate-pulse bg-pink-500 py-1 text-center text-[11px] font-black text-white">프리미엄 입점센터</div>
        <div className="p-2 text-center">
          <div className="text-[10px] text-blue-200">전국 제휴업소</div>
          <div className="mt-1 text-sm font-black leading-tight transition-transform group-hover:scale-105">
            선착순
            <br />
            모집중
          </div>
        </div>
      </Link>

      <div
        className={
          isSidebar
            ? 'flex flex-col divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white text-center shadow-sm'
            : 'grid gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:grid-cols-3'
        }
      >
        {isSidebar ? <div className="bg-gray-100 py-1.5 text-[11px] font-bold text-gray-700">QUICK MENU</div> : null}
        <Link
          href={buildBrowseHref({ mode: 'region' })}
          className={
            isSidebar
              ? 'group flex flex-col items-center gap-1 py-2 transition-colors hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]'
              : 'group flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-3 transition-colors hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]'
          }
        >
          <span className="text-xl transition-transform group-hover:-translate-y-0.5">📋</span>
          <span>
            <span className="block text-[10px] font-bold sm:text-xs">전체업소</span>
            {!isSidebar ? <span className="block text-[11px] text-gray-400">지역별 목록으로 이동</span> : null}
          </span>
        </Link>
        <Link
          href={buildBrowseHref({ mode: directoryMode, sort: 'popular' })}
          className={
            isSidebar
              ? 'group flex flex-col items-center gap-1 py-2 transition-colors hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]'
              : 'group flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-3 transition-colors hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]'
          }
        >
          <span className="text-xl transition-transform group-hover:-translate-y-0.5">🏆</span>
          <span>
            <span className="block text-[10px] font-bold sm:text-xs">인기순위</span>
            {!isSidebar ? <span className="block text-[11px] text-gray-400">현재 조건 기준 랭킹</span> : null}
          </span>
        </Link>
        <div
          className={
            isSidebar
              ? 'flex flex-col items-center py-2'
              : 'flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-3 text-left'
          }
        >
          {isSidebar ? <span className="mb-1 text-[10px] text-gray-400">최근 본 업소</span> : <span className="text-xl">🕘</span>}
          <div>
            <span className="block text-[10px] text-gray-400 sm:text-xs">최근 본 업소</span>
            {isSidebar ? (
              <div className="mt-1 flex h-16 w-16 items-center justify-center rounded border border-gray-200 bg-gray-50 text-[10px] text-gray-400">없음</div>
            ) : (
              <span className="block text-[11px] text-gray-400">아직 없습니다</span>
            )}
          </div>
        </div>
      </div>

      {isSidebar ? (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex w-full items-center justify-center gap-1 rounded-lg bg-gray-800 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-gray-700"
        >
          ▲ TOP
        </button>
      ) : null}
    </div>
  );
}
