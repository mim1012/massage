'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { REGIONS, THEMES, DISTRICTS } from '@/lib/types';
import clsx from 'clsx';

export default function Sidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentRegion = searchParams.get('region') ?? '';
  const currentSubRegion = searchParams.get('subRegion') ?? '';
  const currentTheme = searchParams.get('theme') ?? '';

  // 기본 경로 결정 (/top100 이면 계속 /top100 유지, 그 외엔 /)
  const baseUrl = pathname.startsWith('/top100') ? '/top100' : '/';

  return (
    <aside className="hidden md:block w-[180px] shrink-0">
      <div className="sticky top-[110px] space-y-3">
        {/* 지역별 메뉴 */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-[#D4A373] text-white text-xs font-bold px-3 py-2">
            📍 지역별 업소
          </div>
          <div>
            <Link
              href="/"
              className={clsx('lnb-menu-item', !currentRegion && !currentTheme && 'active')}
            >
              전체보기
            </Link>
            {REGIONS.filter(r => r.code !== 'all').map(r => (
              <div key={r.code}>
                <Link
                  href={`${baseUrl}?region=${r.code}`}
                  className={clsx('lnb-menu-item', currentRegion === r.code && !currentSubRegion && 'active')}
                >
                  &rsaquo; {r.label}
                </Link>
                {/* 해당 지역이 선택되었고 세부 구가 있다면 표시 */}
                {currentRegion === r.code && DISTRICTS[r.code] && (
                  <div className="bg-gray-50/80 border-b border-gray-100 pb-1">
                    {DISTRICTS[r.code].filter(d => d.code !== 'all').map(d => (
                      <Link
                        key={d.code}
                        href={`${baseUrl}?region=${r.code}&subRegion=${d.code}`}
                        className={clsx('block px-3 py-1.5 text-xs text-gray-500 hover:text-[#D4A373] pl-6 border-b border-white/50 last:border-0', currentSubRegion === d.code && 'text-[#D4A373] font-bold')}
                      >
                        - {d.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 인기순위 */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-yellow-500 text-white text-xs font-bold px-3 py-2 flex items-center gap-1">
            <span>🏆</span> 인기순위 (TOP 100)
          </div>
          <div>
            <Link href="/top100" className={clsx('lnb-menu-item font-bold text-gray-700 hover:text-[#D4A373]', pathname === '/top100' && 'active')}>
              &rsaquo; 주간 인기 추천업소
            </Link>
            <Link href="/?sort=new" className="lnb-menu-item font-bold text-gray-700 hover:text-[#D4A373]">
              &rsaquo; 신규 등록 업소
            </Link>
          </div>
        </div>

        {/* 테마별 메뉴 */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-orange-500 text-white text-xs font-bold px-3 py-2">
            🏷️ 테마별 업소
          </div>
          <div>
            {THEMES.filter(t => t.code !== 'all').map(t => (
              <Link
                key={t.code}
                href={`${baseUrl}?theme=${t.code}`}
                className={clsx('lnb-menu-item', currentTheme === t.code && 'active')}
              >
                &rsaquo; {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 고객센터 */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-700 text-white text-xs font-bold px-3 py-2">
            📞 고객센터
          </div>
          <div>
            <Link href="/board/notice" className="lnb-menu-item">&rsaquo; 공지사항</Link>
            <Link href="/board/qna" className="lnb-menu-item">&rsaquo; Q&A 문의</Link>
            <Link href="/board/review" className="lnb-menu-item">&rsaquo; 업소 후기</Link>
          </div>
        </div>

        {/* 광고/입점 배너 영역 */}
        <div className="space-y-2 mt-4">
          <Link href="/board/notice" className="block w-full bg-[#183b70] text-white rounded p-3 text-center border-2 border-[#102a52] hover:bg-[#1f4a8a] transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5 duration-200">
            <div className="text-[10px] text-blue-200 mb-0.5">건마에반하다</div>
            <div className="font-black text-[15px] mb-1">광고 안내</div>
            <div className="inline-block bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">바로가기 &gt;</div>
          </Link>
          
          <Link href="/board/partnership" className="block w-full bg-[#f8f9fa] text-gray-800 rounded p-3 text-center border-2 border-gray-300 hover:border-gray-400 hover:bg-white transition-all shadow-sm cursor-pointer hover:-translate-y-0.5 duration-200">
            <div className="text-[10px] text-gray-500 mb-0.5">힐링찾기</div>
            <div className="font-black text-[15px] text-[#D4A373] mb-1">입점 문의</div>
            <div className="inline-block bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">모집중 &gt;</div>
          </Link>

          {/* 광고 배너 슬롯 Placeholder */}
          <div className="bg-gray-100 h-[150px] rounded border border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <div className="text-xl mb-1">🎯</div>
            <span className="text-xs font-bold">배너 슬롯</span>
            <span className="text-[10px]">180×150</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
