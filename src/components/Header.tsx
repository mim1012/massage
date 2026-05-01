'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { REGIONS, THEMES, DISTRICTS } from '@/lib/catalog';
import { buildBrowseHref, getDirectoryMode } from '@/lib/directory-mode';
import { useSiteContent } from '@/lib/use-site-content';
import SidebarPromoBanners from '@/components/public/SidebarPromoBanners';
import clsx from 'clsx';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentRegion = searchParams.get('region');
  const currentSubRegion = searchParams.get('subRegion');
  const currentTheme = searchParams.get('theme');
  const directoryMode = getDirectoryMode(searchParams.get('view'));
  const { siteSettings } = useSiteContent();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(
      buildBrowseHref({
        mode: directoryMode,
        region: selectedRegion,
        q: searchQuery,
      }),
    );
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[var(--portal-brand)] bg-[var(--portal-bg)] shadow-sm">
      <div className="bg-[var(--portal-brand)] py-1 text-center text-xs font-medium text-white">
        🎁 제휴업소 입점 문의 환영! &nbsp;|&nbsp; 프리미엄 배너 광고 진행중 &nbsp;|&nbsp; ☎ {siteSettings.contactPhone}
      </div>

      <div className="max-w-[1400px] mx-auto px-3">
        <div className="flex h-14 items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--portal-brand)] shadow-sm">
              <span className="text-white font-black text-sm">{siteSettings.siteName[0]}</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="text-base font-black text-[var(--portal-brand)]">{siteSettings.siteName}</span>
              <span className="text-gray-400 text-[10px] block -mt-0.5">{siteSettings.siteDescription}</span>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="mx-auto min-w-0 flex-1 max-w-xl">
            <div className="flex gap-0 overflow-hidden rounded-lg border border-gray-300 shadow-sm transition-all focus-within:border-[var(--portal-brand)] focus-within:ring-1 focus-within:ring-[color-mix(in_srgb,var(--portal-brand)_30%,transparent)]">
              <select
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                className="shrink-0 pl-2.5 pr-1 py-2 text-sm bg-gray-50 border-r border-gray-200 text-gray-700 focus:outline-none"
              >
                <option value="all">전체지역</option>
                {REGIONS.filter((region) => region.code !== 'all').map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="업소명, 테마 검색"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="flex-1 pl-3 pr-2 py-2 text-sm focus:outline-none bg-white min-w-0"
              />
              <button type="submit" className="shrink-0 bg-[var(--portal-brand)] px-3 text-white transition-colors hover:bg-[var(--portal-brand-hover)]">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link href="/auth/login" className="hidden px-2 py-1 text-xs text-gray-600 hover:text-[var(--portal-brand)] sm:block">
              로그인
            </Link>
            <span className="text-gray-300 hidden sm:block">|</span>
            <Link href="/auth/register" className="hidden px-2 py-1 text-xs text-gray-600 hover:text-[var(--portal-brand)] sm:block">
              회원가입
            </Link>
            <span className="text-gray-300 hidden sm:block">|</span>
            <Link href="/admin" className="hidden px-2 py-1 text-xs text-gray-600 hover:text-[var(--portal-brand)] sm:block">
              관리자
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 text-gray-600">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden border-t border-[var(--portal-gnb-hover)] bg-[var(--portal-gnb)] shadow-md md:block">
        <div className="max-w-[1400px] mx-auto px-3">
          <ul className="flex items-center text-white text-base font-bold">
            <li>
              <Link
                href="/?view=list"
                className={clsx(
                  'block px-6 py-3 transition-colors hover:bg-[var(--portal-gnb-hover)] hover:text-[var(--portal-brand-soft)]',
                  directoryMode === 'region' && 'bg-[var(--portal-gnb-hover)] text-[var(--portal-brand-soft)]',
                )}
              >
                지역별업소
              </Link>
            </li>
            <li>
              <Link
                href="/?view=theme"
                className={clsx(
                  'block px-6 py-3 transition-colors hover:bg-[var(--portal-gnb-hover)] hover:text-[var(--portal-brand-soft)]',
                  directoryMode === 'theme' && 'bg-[var(--portal-gnb-hover)] text-[var(--portal-brand-soft)]',
                )}
              >
                테마별업소
              </Link>
            </li>
            <li>
              <Link href="/top100" className="block px-6 py-3 text-yellow-100 transition-colors hover:bg-[var(--portal-gnb-hover)] hover:text-[var(--portal-brand-soft)]">
                인기순위
              </Link>
            </li>
            <li>
              <Link href="/board" className="block px-6 py-3 transition-colors hover:bg-[var(--portal-gnb-hover)] hover:text-[var(--portal-brand-soft)]">
                커뮤니티
              </Link>
            </li>
            <li>
              <Link href="/board/qna" className="block px-6 py-3 transition-colors hover:bg-[var(--portal-gnb-hover)] hover:text-[var(--portal-brand-soft)]">
                고객센터
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3">
        <div className="hidden md:block">
          <nav className="flex items-center border-t border-gray-200 -mx-3 px-3 overflow-x-auto scrollbar-hide bg-white">
            {REGIONS.filter((region) => region.code !== 'all').map((region) => (
              <Link
                key={region.code}
                href={buildBrowseHref({ mode: 'region', region: region.code, theme: currentTheme })}
                className={clsx(
                  'shrink-0 border-b-2 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]',
                  currentRegion === region.code ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]' : 'border-transparent',
                )}
              >
                {region.label}
              </Link>
            ))}
            <div className="mx-1 h-4 w-px self-center bg-gray-300" />
            {THEMES.filter((theme) => theme.code !== 'all')
              .slice(0, 5)
              .map((theme) => (
                <Link
                  key={theme.code}
                  href={buildBrowseHref({
                    mode: 'theme',
                    region: currentRegion,
                    subRegion: currentSubRegion,
                    theme: theme.code,
                  })}
                  className={clsx(
                    'shrink-0 border-b-2 px-3 py-2 text-sm transition-all hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]',
                    currentTheme === theme.code
                      ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]'
                      : 'border-transparent text-gray-500',
                  )}
                >
                  {theme.label}
                </Link>
              ))}
          </nav>

          {currentRegion && DISTRICTS[currentRegion] && (
            <div className="bg-gray-50 border border-gray-200 p-3 mb-2 rounded grid grid-cols-8 gap-y-2 gap-x-2">
              {DISTRICTS[currentRegion].map((district) => (
                <Link
                  key={district.code}
                  href={buildBrowseHref({
                    mode: directoryMode,
                    region: currentRegion,
                    subRegion: district.code,
                    theme: currentTheme,
                  })}
                  className={clsx(
                    'text-[13px] text-center rounded py-1',
                    district.code === 'all' && (!currentSubRegion || currentSubRegion === 'all')
                      ? 'bg-[var(--portal-brand)] text-white font-bold'
                      : currentSubRegion === district.code
                        ? 'bg-[var(--portal-brand)] text-white font-bold'
                        : 'text-gray-700 hover:bg-gray-200',
                  )}
                >
                  {district.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <form onSubmit={handleSearch} className="p-3 border-b border-gray-100 space-y-2">
            <select
              value={selectedRegion}
              onChange={(event) => setSelectedRegion(event.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[var(--portal-brand)] focus:outline-none"
            >
              <option value="all">전체지역</option>
              {REGIONS.filter((region) => region.code !== 'all').map((region) => (
                <option key={region.code} value={region.code}>
                  {region.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="업소명, 테마 검색"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-[var(--portal-brand)] focus:outline-none"
              />
              <button type="submit" className="rounded bg-[var(--portal-brand)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--portal-brand-hover)]">
                검색
              </button>
            </div>
          </form>
          <div className="p-3">
            <p className="text-xs text-gray-400 font-bold mb-2">테마별</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {THEMES.filter((theme) => theme.code !== 'all').map((theme) => (
                <Link
                  key={theme.code}
                  href={buildBrowseHref({
                    mode: 'theme',
                    region: currentRegion,
                    subRegion: currentSubRegion,
                    theme: theme.code,
                  })}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:border-[var(--portal-brand)] hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]"
                >
                  {theme.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
              >
                로그인
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 rounded bg-[var(--portal-brand)] py-2 text-center text-xs font-semibold text-white hover:bg-[var(--portal-brand-hover)]"
              >
                회원가입
              </Link>
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-bold text-gray-400">광고/입점</p>
              <SidebarPromoBanners mode="inline" onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around py-1.5">
          {[
            { href: '/', label: '홈', emoji: '🏠' },
            { href: '/?view=list', label: '업소', emoji: '📋' },
            { href: '/board', label: '게시판', emoji: '💬' },
            { href: '/board/qna', label: '고객센터', emoji: '📞' },
            { href: '/auth/login', label: 'MY', emoji: '👤' },
          ].map((item) => (
            <Link key={`${item.label}-${item.href}`} href={item.href} className="flex flex-col items-center gap-0.5 px-3 py-0.5">
              <span className="text-base">{item.emoji}</span>
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
