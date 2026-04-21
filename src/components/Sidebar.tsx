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
        <div className="bg-red-600 px-3 py-2 text-xs font-bold text-white">📍 지역별 업소</div>
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
          <span>🏆</span> 인기순위 (TOP 100)
        </div>
        <div>
          <Link href="/top100" className="lnb-menu-item font-bold text-gray-700 hover:text-red-600">
            &rsaquo; 주간 인기 추천업소
          </Link>
          <Link href="/?sort=new" className="lnb-menu-item font-bold text-gray-700 hover:text-red-600">
            &rsaquo; 신규 등록 업소
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="bg-orange-500 px-3 py-2 text-xs font-bold text-white">🏷️ 테마별 업소</div>
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
        <div className="bg-gray-700 px-3 py-2 text-xs font-bold text-white">📞 고객센터</div>
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

function PromoCard({
  href,
  eyebrow,
  title,
  cta,
  className,
  eyebrowClassName,
  titleClassName,
  ctaClassName,
}: {
  href: string;
  eyebrow: string;
  title: string;
  cta: string;
  className: string;
  eyebrowClassName: string;
  titleClassName?: string;
  ctaClassName: string;
}) {
  return (
    <Link href={href} className={className}>
      <div className={eyebrowClassName}>{eyebrow}</div>
      <div className={clsx('mb-1 text-[15px] font-black', titleClassName)}>{title}</div>
      <div className={ctaClassName}>{cta}</div>
    </Link>
  );
}

export function PromoBlocks({ compact = false }: { compact?: boolean }) {
  const slotHeight = compact ? 'h-[120px]' : 'h-[150px]';

  return (
    <div className="space-y-2">
      <PromoCard
        href="/ad"
        eyebrow="건마에반하다"
        title="광고 안내"
        cta="바로가기 >"
        className="block w-full cursor-pointer rounded border-2 border-[#102a52] bg-[#183b70] p-3 text-center text-white shadow-sm transition-colors duration-200 hover:-translate-y-0.5 hover:bg-[#1f4a8a]"
        eyebrowClassName="mb-0.5 text-[10px] text-blue-200"
        ctaClassName="inline-block rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black"
      />

      <PromoCard
        href="/board/qna"
        eyebrow="건마에반하다"
        title="입점 문의"
        cta="모집중 >"
        className="block w-full cursor-pointer rounded border-2 border-gray-300 bg-[#f8f9fa] p-3 text-center text-gray-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-400 hover:bg-white"
        eyebrowClassName="mb-0.5 text-[10px] text-gray-500"
        titleClassName="text-red-600"
        ctaClassName="inline-block rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-white"
      />

      <div className={clsx('flex flex-col items-center justify-center rounded border border-gray-200 bg-gray-100 text-gray-400', slotHeight)}>
        <div className="mb-1 text-xl">🎯</div>
        <span className="text-xs font-bold">배너 슬롯</span>
        <span className="text-[10px]">{compact ? '160×120' : '180×150'}</span>
      </div>
    </div>
  );
}

export function RightAdRail() {
  return (
    <aside className="hidden w-[180px] shrink-0 xl:block">
      <div className="sticky top-[110px] space-y-3">
        <div className="overflow-hidden rounded border border-gray-200 bg-white">
          <div className="bg-[#183b70] px-3 py-2 text-xs font-bold text-white">우측 광고</div>
          <div className="p-3">
            <PromoBlocks compact />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <>
      <aside className="hidden w-[180px] shrink-0 md:block">
        <div className="sticky top-[110px] space-y-3">
          <RegionMenu />
          <div className="mt-4">
            <PromoBlocks />
          </div>
        </div>
      </aside>

      <section className="space-y-3 md:hidden">
        <div className="rounded border border-gray-200 bg-white p-3">
          <p className="mb-3 text-sm font-black text-gray-800">빠른 탐색</p>
          <div className="grid gap-3">
            <RegionMenu />
          </div>
        </div>
        <PromoBlocks />
      </section>
    </>
  );
}
