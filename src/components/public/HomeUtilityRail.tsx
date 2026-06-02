'use client';

import Link from 'next/link';
import { buildBrowseHref } from '@/lib/directory-mode';

type HomeUtilityRailProps = {
  mode: 'sidebar' | 'inline';
  directoryMode?: 'region' | 'theme';
};

export default function HomeUtilityRail({ mode, directoryMode = 'region' }: HomeUtilityRailProps) {
  if (mode === 'sidebar') {
    return (
      <aside className="hidden lg:block w-[120px] shrink-0">
        <div className="sticky top-[170px] relative z-10 space-y-2">
          <div className="bg-gradient-to-b from-blue-700 to-blue-900 text-white rounded-lg overflow-hidden shadow-sm border-2 border-blue-600 group cursor-pointer hover:shadow-md">
            <div className="bg-pink-500 text-white text-[11px] font-black py-1 text-center animate-pulse">
              프리미엄 입점센터
            </div>
            <div className="p-2 text-center">
              <div className="text-[10px] text-blue-200">전국 제휴업소</div>
              <div className="text-sm font-black mt-1 leading-tight group-hover:scale-105 transition-transform">
                선착순
                <br />
                모집중
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden text-center flex flex-col divide-y divide-gray-100">
            <div className="bg-gray-100 py-1.5 text-[11px] font-bold text-gray-700">QUICK MENU</div>
            <Link
              href={buildBrowseHref({ mode: 'region' })}
              prefetch={false}
              className="py-2 hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)] transition-colors flex flex-col items-center gap-1 group"
            >
              <span className="text-xl group-hover:-translate-y-0.5 transition-transform">📋</span>
              <span className="text-[10px] font-bold">전체업소</span>
            </Link>
            <Link
              href={buildBrowseHref({ mode: directoryMode, sort: 'popular' })}
              prefetch={false}
              className="py-2 hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)] transition-colors flex flex-col items-center gap-1 group"
            >
              <span className="text-xl group-hover:-translate-y-0.5 transition-transform">🏆</span>
              <span className="text-[10px] font-bold">인기순위</span>
            </Link>
            <div className="py-2 flex flex-col items-center">
              <span className="text-[10px] text-gray-400 mb-1">최근 본 업소</span>
              <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-400 flex items-center justify-center">없음</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-full bg-gray-800 text-white font-bold py-2 rounded-lg text-xs hover:bg-gray-700 transition-colors shadow-sm flex items-center justify-center gap-1"
          >
            ▲ TOP
          </button>
        </div>
      </aside>
    );
  }

  return (
    <div className="space-y-3">
      <Link
        href="/board/partnership"
        prefetch={false}
        className="group block cursor-pointer overflow-hidden rounded-lg border-2 border-[var(--portal-blue-banner-border)] bg-gradient-to-b from-[var(--portal-blue-banner-hover)] to-[var(--portal-brand-dark)] text-white shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="bg-[var(--portal-brand)] py-1 text-center text-[11px] font-black text-white">프리미엄 입점센터</div>
        <div className="p-2 text-center">
          <div className="text-[10px] text-white/75">전국 제휴업소</div>
          <div className="mt-1 text-sm font-black leading-tight transition-transform group-hover:scale-105">
            선착순
            <br />
            모집중
          </div>
        </div>
      </Link>

      <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:grid-cols-3">
        <Link
          href={buildBrowseHref({ mode: 'region' })}
          prefetch={false}
          className="group flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-3 transition-colors hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]"
        >
          <span className="text-xl transition-transform group-hover:-translate-y-0.5">📋</span>
          <span>
            <span className="block text-[10px] font-bold sm:text-xs">전체업소</span>
            <span className="block text-[11px] text-gray-400">지역별 목록으로 이동</span>
          </span>
        </Link>
        <Link
          href={buildBrowseHref({ mode: directoryMode, sort: 'popular' })}
          prefetch={false}
          className="group flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-3 transition-colors hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]"
        >
          <span className="text-xl transition-transform group-hover:-translate-y-0.5">🏆</span>
          <span>
            <span className="block text-[10px] font-bold sm:text-xs">인기순위</span>
            <span className="block text-[11px] text-gray-400">현재 조건 기준 랭킹</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-3 text-left">
          <span className="text-xl">🕘</span>
          <div>
            <span className="block text-[10px] text-gray-400 sm:text-xs">최근 본 업소</span>
            <span className="block text-[11px] text-gray-400">아직 없습니다</span>
          </div>
        </div>
      </div>
    </div>
  );
}
