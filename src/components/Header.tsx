'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X } from 'lucide-react';
import SmartPrefetchLink from '@/components/SmartPrefetchLink';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { REGIONS, DISTRICTS } from '@/lib/catalog';
import { useThemes } from '@/lib/use-themes';
import { buildBrowseHref, getDirectoryMode } from '@/lib/directory-mode';
import { useSiteContent } from '@/lib/use-site-content';
import { useAuthSession } from '@/lib/use-auth-session';
import { getMyHref, getMyLabel, isAdminAreaPath, isOwnerAreaPath } from '@/lib/auth/navigation';
import clsx from 'clsx';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [loggingOut, setLoggingOut] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentRegion = searchParams.get('region');
  const currentSubRegion = searchParams.get('subRegion');
  const currentTheme = searchParams.get('theme');
  const directoryMode = getDirectoryMode(searchParams.get('view'));
  const themeEntryRegion = currentRegion ?? 'seoul';
  const { siteSettings } = useSiteContent();
  const { user, authChecked, refetch, clearSession } = useAuthSession();
  const themes = useThemes();
  const myHref = getMyHref(user?.role);
  const myLabel = getMyLabel(user?.role);
  const isAuthed = authChecked && Boolean(user);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    
    // If we're on a non-home page (like board or qna), always go back to home for search
    const basePath = pathname === '/' || pathname === '/top100' ? pathname : '/';

    router.push(
      buildBrowseHref({
        basePath,
        mode: directoryMode,
        region: selectedRegion,
        q: searchQuery,
      }),
    );
    setMobileMenuOpen(false);
  };

  // Sync state with URL params
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedRegion(searchParams.get('region') || 'all');
  }, [searchParams]);

  useEffect(() => {
    const prefetchMenuRoutes = () => {
      for (const href of ['/', '/top100', '/board', '/ad', '/board/qna']) {
        router.prefetch(href);
      }
    };

    const idleCallback: number =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(prefetchMenuRoutes, { timeout: 2000 })
        : window.setTimeout(prefetchMenuRoutes, 1200);

    return () => {
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleCallback);
      } else {
        window.clearTimeout(idleCallback);
      }
    };
  }, [router]);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
      });
    } finally {
      clearSession();
      setMobileMenuOpen(false);
      if (isOwnerAreaPath(pathname) || pathname?.startsWith('/my') || isAdminAreaPath(pathname)) {
        router.replace('/auth/login');
      } else {
        await refetch();
        router.refresh();
      }
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[var(--portal-brand)] bg-[var(--portal-bg)] shadow-sm">
      <div className="bg-[var(--portal-brand)] py-1 text-center text-xs font-medium text-white">
        🎁 제휴업소 입점 문의 환영! &nbsp;|&nbsp; 프리미엄 배너 광고 진행중 &nbsp;|&nbsp; ☎ {siteSettings.contactPhone}
      </div>

      <div className="max-w-[1400px] mx-auto px-3">
        <div className="flex h-14 items-center gap-2 sm:gap-3">
          <SmartPrefetchLink
            href="/"
            prefetch={false}
            aria-label="메인 홈으로 이동"
            className="flex items-center gap-1.5 shrink-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--portal-brand)] shadow-sm">
              <span className="text-white font-black text-sm">{siteSettings.siteName[0]}</span>
            </div>
            <div className="block leading-tight">
              <span className="text-sm font-black text-[var(--portal-brand)] sm:text-base">{siteSettings.siteName}</span>
              <span className="block -mt-0.5 text-[9px] text-gray-400 sm:text-[10px]">HEALING DIRECTORY</span>
            </div>
          </SmartPrefetchLink>

          <form onSubmit={handleSearch} className="mx-auto min-w-0 flex-1 max-w-xl">
            <div className="flex gap-0 overflow-hidden rounded-lg border border-gray-300 shadow-sm transition-all focus-within:border-[var(--portal-brand)] focus-within:ring-1 focus-within:ring-[color-mix(in_srgb,var(--portal-brand)_30%,transparent)]">
              <select
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                className="shrink-0 pl-2.5 pr-1 py-2 text-sm bg-gray-50 border-r border-gray-200 text-gray-700 focus:outline-none"
              >
                <option value="all">전체지역</option>
                {REGIONS.filter((region) => ['seoul', 'gyeonggi', 'incheon', 'busan', 'daegu', 'jeju'].includes(region.code)).map((region) => (
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
            {!isAuthed ? (
              <>
                <Link href="/auth/login" prefetch={false} className="hidden px-2 py-1 text-xs text-gray-600 hover:text-[var(--portal-brand)] sm:block">
                  로그인
                </Link>
                <span className="text-gray-300 hidden sm:block">|</span>
                <Link href="/auth/register" prefetch={false} className="hidden px-2 py-1 text-xs text-gray-600 hover:text-[var(--portal-brand)] sm:block">
                  회원가입
                </Link>
              </>
            ) : (
              <>
                <span className="hidden text-xs font-semibold text-gray-500 sm:block">{user?.name}</span>
                <span className="text-gray-300 hidden sm:block">|</span>
                <Link href={myHref} prefetch={false} className="hidden px-2 py-1 text-xs text-gray-600 hover:text-[var(--portal-brand)] sm:block">
                  {user?.role === 'OWNER' ? '내 업소관리' : myLabel}
                </Link>
                <span className="text-gray-300 hidden sm:block">|</span>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="hidden px-2 py-1 text-xs text-gray-600 hover:text-[var(--portal-brand)] sm:block"
                >
                  {loggingOut ? '로그아웃 중...' : '로그아웃'}
                </button>
              </>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 text-gray-600">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white px-3 py-2 md:hidden">
        {!isAuthed ? (
          <div className="mx-auto flex max-w-[1400px] items-center justify-end gap-2 text-[11px]">
            <Link href="/auth/login" prefetch={false} className="rounded border border-gray-300 px-2.5 py-1 text-gray-600">
              로그인
            </Link>
            <Link href="/auth/register" prefetch={false} className="rounded bg-[var(--portal-brand)] px-2.5 py-1 font-semibold text-white">
              회원가입
            </Link>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 text-[11px]">
            <span className="truncate font-semibold text-gray-500">{user?.name}</span>
            <div className="flex items-center gap-2">
              <Link href={myHref} prefetch={false} className="rounded border border-gray-300 px-2.5 py-1 text-gray-600">
                {user?.role === 'OWNER' ? '내 업소관리' : user?.role === 'ADMIN' ? '관리 패널' : myLabel}
              </Link>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded border border-gray-300 px-2.5 py-1 text-gray-600"
              >
                {loggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hidden border-t border-[var(--portal-gnb-hover)] bg-[var(--portal-gnb)] shadow-md md:block">
        <div className="max-w-[1400px] mx-auto px-3">
          <ul className="flex items-center text-white text-base font-bold">
            <li>
              <SmartPrefetchLink
                href="/?view=list"
                prefetch={false}
                className={clsx(
                  'block px-6 py-3 transition-colors hover:bg-[var(--portal-gnb-hover)] hover:text-[var(--portal-brand-soft)]',
                  directoryMode === 'region' && 'bg-[var(--portal-gnb-hover)] text-[var(--portal-brand-soft)]',
                )}
              >
                지역별업소
              </SmartPrefetchLink>
            </li>
            <li>
              <SmartPrefetchLink
                href={buildBrowseHref({ mode: 'theme', region: themeEntryRegion, theme: currentTheme })}
                prefetch={false}
                className={clsx(
                  'block px-6 py-3 transition-colors hover:bg-[var(--portal-gnb-hover)] hover:text-[var(--portal-brand-soft)]',
                  directoryMode === 'theme' && 'bg-[var(--portal-gnb-hover)] text-[var(--portal-brand-soft)]',
                )}
              >
                테마별업소
              </SmartPrefetchLink>
            </li>
            <li>
              <SmartPrefetchLink href="/top100" prefetch={false} className="block px-6 py-3 text-sky-300 transition-colors hover:bg-[var(--portal-gnb-hover)]">
                인기순위
              </SmartPrefetchLink>
            </li>
            <li>
              <SmartPrefetchLink href="/board" prefetch={false} className="block px-6 py-3 transition-colors hover:bg-[var(--portal-gnb-hover)] hover:text-[var(--portal-brand-soft)]">
                커뮤니티
              </SmartPrefetchLink>
            </li>
            <li>
              <SmartPrefetchLink href="/ad" prefetch={false} className="block px-6 py-3 text-amber-300 transition-colors hover:bg-[var(--portal-gnb-hover)]">
                광고안내
              </SmartPrefetchLink>
            </li>
            <li>
              <SmartPrefetchLink href="/board/qna" prefetch={false} className="block px-6 py-3 transition-colors hover:bg-[var(--portal-gnb-hover)] hover:text-[var(--portal-brand-soft)]">
                고객센터
              </SmartPrefetchLink>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3">
        <div className="hidden md:block">
          <nav className="flex items-center border-t border-gray-200 -mx-3 px-3 overflow-x-auto scrollbar-hide bg-white">
            {REGIONS.filter((region) => region.code !== 'all').map((region) => (
              <SmartPrefetchLink
                key={region.code}
                href={buildBrowseHref({ mode: directoryMode, region: region.code, theme: currentTheme })}
                prefetch={false}
                className={clsx(
                  'shrink-0 border-b-2 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]',
                  currentRegion === region.code ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]' : 'border-transparent',
                )}
              >
                {region.label}
              </SmartPrefetchLink>
            ))}
            <div className="mx-1 h-4 w-px self-center bg-gray-300" />
            {themes.filter((theme) => theme.code !== 'all')
              .slice(0, 5)
              .map((theme) => (
                <SmartPrefetchLink
                  key={theme.code}
                  href={buildBrowseHref({
                    mode: 'theme',
                    region: themeEntryRegion,
                    subRegion: currentRegion ? currentSubRegion : undefined,
                    theme: theme.code,
                  })}
                  prefetch={false}
                  className={clsx(
                    'shrink-0 border-b-2 px-3 py-2 text-sm transition-all hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]',
                    currentTheme === theme.code
                      ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]'
                      : 'border-transparent text-gray-500',
                  )}
                >
                  {theme.label}
                </SmartPrefetchLink>
              ))}
          </nav>

          {directoryMode === 'theme' && currentRegion && (!currentTheme || currentTheme === 'all') && (
            <div className="bg-gray-50 border border-gray-200 p-3 mb-2 rounded flex flex-wrap gap-2">
              <SmartPrefetchLink
                href={buildBrowseHref({
                  mode: directoryMode,
                  region: currentRegion,
                  subRegion: currentSubRegion,
                  theme: 'all',
                })}
                prefetch={false}
                className={clsx(
                  'text-[13px] text-center rounded py-1 px-4 border',
                  !currentTheme || currentTheme === 'all'
                    ? 'bg-[var(--portal-brand)] text-white font-bold border-[var(--portal-brand)]'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200',
                )}
              >
                전체
              </SmartPrefetchLink>
              {themes.filter((theme) => theme.code !== 'all').map((theme) => (
                <SmartPrefetchLink
                  key={theme.code}
                  href={buildBrowseHref({
                    mode: directoryMode,
                    region: currentRegion,
                    subRegion: currentSubRegion,
                    theme: theme.code,
                  })}
                  prefetch={false}
                  className={clsx(
                    'text-[13px] text-center rounded py-1 px-4 border',
                    currentTheme === theme.code
                      ? 'bg-[var(--portal-brand)] text-white font-bold border-[var(--portal-brand)]'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200',
                  )}
                >
                  {theme.label}
                </SmartPrefetchLink>
              ))}
            </div>
          )}

          {currentRegion && DISTRICTS[currentRegion] && (!currentSubRegion || currentSubRegion === 'all') && (
            <div className="bg-gray-50 border border-gray-200 p-3 mb-2 rounded grid grid-cols-8 gap-y-2 gap-x-2">
              {DISTRICTS[currentRegion].map((district) => (
                <SmartPrefetchLink
                  key={district.code}
                  href={buildBrowseHref({
                    mode: directoryMode,
                    region: currentRegion,
                    subRegion: district.code,
                    theme: currentTheme,
                  })}
                  prefetch={false}
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
                </SmartPrefetchLink>
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
              {themes.filter((theme) => theme.code !== 'all').map((theme) => (
                <Link
                  key={theme.code}
                  href={buildBrowseHref({
                    mode: 'theme',
                    region: themeEntryRegion,
                    subRegion: currentRegion ? currentSubRegion : undefined,
                    theme: theme.code,
                  })}
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:border-[var(--portal-brand)] hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)]"
                >
                  {theme.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 mb-4">
              <p className="text-xs text-gray-400 font-bold mb-2">고객 및 제휴 서비스</p>
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href="/ad"
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center py-2.5 text-xs border border-amber-200 rounded-xl bg-amber-50 font-bold text-amber-700 hover:bg-amber-100/70 shadow-sm"
                >
                  <span className="text-base mb-0.5">📢</span> 광고안내
                </Link>
                <Link
                  href="/board/partnership"
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center py-2.5 text-xs border border-rose-200 rounded-xl bg-rose-50 font-bold text-rose-700 hover:bg-rose-100/70 shadow-sm"
                >
                  <span className="text-base mb-0.5">✍️</span> 제휴입점
                </Link>
                <Link
                  href="/board/qna"
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center py-2.5 text-xs border border-blue-200 rounded-xl bg-blue-50 font-bold text-blue-700 hover:bg-blue-100/70 shadow-sm"
                >
                  <span className="text-base mb-0.5">📞</span> 고객센터
                </Link>
              </div>
            </div>
            {!isAuthed ? (
              <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-2">
                <Link
                  href="/auth/login"
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/register"
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded bg-[var(--portal-brand)] py-2 text-center text-xs font-semibold text-white hover:bg-[var(--portal-brand-hover)]"
                >
                  회원가입
                </Link>
                <Link
                  href="/admin"
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                >
                  관리자
                </Link>
              </div>
            ) : (
              <div className="space-y-2 border-t border-gray-100 pt-3 text-xs">
                <p className="font-semibold text-gray-500">{user?.name} ({user?.email})</p>
                <div className="flex gap-2">
                  <Link
                    href={myHref}
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded border border-gray-300 py-2 text-center text-gray-700 hover:bg-gray-50"
                  >
                    {user?.role === 'OWNER' ? '내 업소관리' : myLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex-1 rounded bg-gray-100 py-2 text-center font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    {loggingOut ? '로그아웃 중...' : '로그아웃'}
                  </button>
                </div>
              </div>
            )}
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
            { href: myHref, label: myLabel, emoji: '👤' },
          ].map((item) => (
            <SmartPrefetchLink key={`${item.label}-${item.href}`} href={item.href} prefetch={false} className="flex flex-col items-center gap-0.5 px-3 py-0.5">
              <span className="text-base">{item.emoji}</span>
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </SmartPrefetchLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
