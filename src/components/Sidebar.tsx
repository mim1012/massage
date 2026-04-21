'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { DISTRICTS, REGIONS, THEMES } from '@/lib/catalog';

function RegionMenu() {
  const searchParams = useSearchParams();
  const currentRegion = searchParams.get('region') ?? '';
  const currentSubRegion = searchParams.get('subRegion') ?? '';
  const currentTheme = searchParams.get('theme') ?? '';

  return (
    <>
      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="bg-red-600 px-3 py-2 text-xs font-bold text-white">지역별 업소</div>
        <div>
          <Link href="/" className={clsx('lnb-menu-item', !currentRegion && !currentTheme && 'active')}>
            전체보기
          </Link>
          {REGIONS.filter((region) => region.code !== 'all').map((region) => (
            <div key={region.code}>
              <Link
                href={`/?region=${region.code}`}
                className={clsx('lnb-menu-item', currentRegion === region.code && !currentSubRegion && 'active')}
              >
                &rsaquo; {region.label}
              </Link>
              {currentRegion === region.code && DISTRICTS[region.code] ? (
                <div className="border-b border-gray-100 bg-gray-50/80 pb-1">
                  {DISTRICTS[region.code]
                    .filter((district) => district.code !== 'all')
                    .map((district) => (
                      <Link
                        key={district.code}
                        href={`/?region=${region.code}&subRegion=${district.code}`}
                        className={clsx(
                          'block border-b border-white/50 px-3 py-1.5 pl-6 text-xs text-gray-500 last:border-0 hover:text-red-600',
                          currentSubRegion === district.code && 'font-bold text-red-600',
                        )}
                      >
                        - {district.label}
                      </Link>
                    ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="flex items-center gap-1 bg-yellow-500 px-3 py-2 text-xs font-bold text-white">
          <span>★</span> 인기순위 (TOP 100)
        </div>
        <div>
          <Link href="/?sort=popular" className="lnb-menu-item font-bold text-gray-700 hover:text-red-600">
            &rsaquo; 주간 인기 추천업소
          </Link>
          <Link href="/?sort=new" className="lnb-menu-item font-bold text-gray-700 hover:text-red-600">
            &rsaquo; 신규 등록 업소
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="bg-orange-500 px-3 py-2 text-xs font-bold text-white">테마별 업소</div>
        <div>
          {THEMES.filter((theme) => theme.code !== 'all').map((theme) => (
            <Link
              key={theme.code}
              href={`/?theme=${theme.code}`}
              className={clsx('lnb-menu-item', currentTheme === theme.code && 'active')}
            >
              &rsaquo; {theme.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="bg-gray-700 px-3 py-2 text-xs font-bold text-white">고객센터</div>
        <div>
          <Link href="/board/notice" className="lnb-menu-item">
            &rsaquo; 공지사항
          </Link>
          <Link href="/board/qna" className="lnb-menu-item">
            &rsaquo; Q&amp;A 문의
          </Link>
          <Link href="/board/review" className="lnb-menu-item">
            &rsaquo; 업소 후기
          </Link>
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  return (
    <>
      <aside className="hidden w-[180px] shrink-0 md:block">
        <div className="sticky top-[110px] space-y-3">
          <RegionMenu />
        </div>
      </aside>

      <section className="space-y-3 md:hidden">
        <div className="rounded border border-gray-200 bg-white p-3">
          <p className="mb-3 text-sm font-black text-gray-800">빠른 탐색</p>
          <div className="grid gap-3">
            <RegionMenu />
          </div>
        </div>
      </section>
    </>
  );
}
