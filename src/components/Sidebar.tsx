'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { REGIONS, THEMES, DISTRICTS } from '@/lib/catalog';
import { buildBrowseHref } from '@/lib/directory-mode';
import SidebarPromoBanners from '@/components/public/SidebarPromoBanners';
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
          <div className="bg-[var(--portal-brand)] px-3 py-2 text-xs font-bold text-white">📍 지역별 업소</div>
          <div>
            <Link href={buildBrowseHref({ mode: 'region', basePath: baseUrl })} prefetch={false} className={clsx('lnb-menu-item', !currentRegion && !currentTheme && 'active')}>
              전체보기
            </Link>
            {REGIONS.filter((r) => r.code !== 'all').map((r) => (
              <div key={r.code}>
                <Link
                  href={buildBrowseHref({ mode: 'region', basePath: baseUrl, region: r.code, theme: currentTheme })}
                  prefetch={false}
                  className={clsx('lnb-menu-item', currentRegion === r.code && !currentSubRegion && 'active')}
                >
                  &rsaquo; {r.label}
                </Link>
                {/* 해당 지역이 선택되었고 세부 구가 있다면 표시 */}
                {currentRegion === r.code && DISTRICTS[r.code] && (
                  <div className="bg-gray-50/80 border-b border-gray-100 pb-1">
                    {DISTRICTS[r.code]
                      .filter((d) => d.code !== 'all')
                      .map((d) => (
                        <Link
                          key={d.code}
                          href={buildBrowseHref({
                            mode: 'region',
                            basePath: baseUrl,
                            region: r.code,
                            subRegion: d.code,
                            theme: currentTheme,
                          })}
                          prefetch={false}
                          className={clsx(
                            'block border-b border-white/50 px-3 py-1.5 pl-6 text-xs text-gray-500 last:border-0 hover:text-[var(--portal-brand)]',
                            currentSubRegion === d.code && 'font-bold text-[var(--portal-brand)]',
                          )}
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
          <div className="flex items-center gap-1 bg-[var(--portal-rank)] px-3 py-2 text-xs font-bold text-white">
            <span>🏆</span> 인기순위 (TOP 100)
          </div>
          <div>
            <Link
              href="/top100"
              prefetch={false}
              className={clsx(
                'lnb-menu-item font-bold text-gray-700 hover:text-[var(--portal-brand)]',
                pathname === '/top100' && 'active',
              )}
            >
              &rsaquo; 주간 인기 추천업소
            </Link>
            <Link href="/?sort=new" prefetch={false} className="lnb-menu-item font-bold text-gray-700 hover:text-[var(--portal-brand)]">
              &rsaquo; 신규 등록 업소
            </Link>
          </div>
        </div>

        {/* 테마별 메뉴 */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-[var(--portal-theme)] px-3 py-2 text-xs font-bold text-white">🏷️ 테마별 업소</div>
          <div>
            {THEMES.filter((t) => t.code !== 'all').map((t) => (
              <Link
                key={t.code}
                href={buildBrowseHref({ mode: 'theme', basePath: baseUrl, theme: t.code, region: currentRegion, subRegion: currentSubRegion })}
                prefetch={false}
                className={clsx('lnb-menu-item', currentTheme === t.code && 'active')}
              >
                &rsaquo; {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 고객센터 */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-[var(--portal-support)] px-3 py-2 text-xs font-bold text-white">📞 고객센터</div>
          <div>
            <Link href="/board/notice" prefetch={false} className="lnb-menu-item">
              &rsaquo; 공지사항
            </Link>
            <Link href="/board/qna" prefetch={false} className="lnb-menu-item">
              &rsaquo; Q&amp;A 문의
            </Link>
            <Link href="/board/review" prefetch={false} className="lnb-menu-item">
              &rsaquo; 업소 후기
            </Link>
          </div>
        </div>

        {/* 광고/입점 배너 영역 */}
        <SidebarPromoBanners mode="sidebar" />
      </div>
    </aside>
  );
}
