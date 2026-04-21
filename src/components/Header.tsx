'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { DISTRICTS, REGIONS, THEMES } from '@/lib/catalog';
import { useSiteContent } from '@/lib/use-site-content';
import { useSessionUser } from '@/lib/use-session-user';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentRegion = searchParams.get('region');
  const currentSubRegion = searchParams.get('subRegion');
  const { siteSettings } = useSiteContent();
  const currentUser = useSessionUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (selectedRegion !== 'all') params.set('region', selectedRegion);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    router.push(`/?${params.toString()}`);
    setMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b-2 border-red-600 bg-white shadow-sm">
      <div className="bg-red-600 py-1 text-center text-xs font-medium text-white">
        제휴 업소 입점 문의 환영 | 고객센터 | ☎ {siteSettings.contactPhone}
      </div>

      <div className="mx-auto max-w-[1400px] px-3">
        <div className="flex h-14 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600">
              <span className="text-sm font-black text-white">{siteSettings.siteName[0]}</span>
            </div>
            <div className="hidden leading-tight sm:block">
              <span className="text-base font-black text-red-600">{siteSettings.siteName}</span>
              <span className="block text-[10px] text-gray-400">{siteSettings.siteDescription}</span>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="mx-auto flex-1 md:max-w-xl">
            <div className="flex overflow-hidden rounded-lg border border-gray-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30">
              <select
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                className="shrink-0 border-r border-gray-200 bg-gray-50 px-2.5 py-2 text-sm text-gray-700 focus:outline-none"
              >
                <option value="all">전체 지역</option>
                {REGIONS.filter((region) => region.code !== 'all').map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="업소명 또는 테마 검색"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-w-0 flex-1 bg-white py-2 pl-3 pr-2 text-sm focus:outline-none"
              />
              <button type="submit" className="bg-red-600 px-3 text-white hover:bg-red-700">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link href="/auth/login" className="hidden px-2 py-1 text-xs text-gray-600 hover:text-red-600 sm:block">
              로그인
            </Link>
            <span className="hidden text-gray-300 sm:block">|</span>
            <Link href="/auth/register" className="hidden px-2 py-1 text-xs text-gray-600 hover:text-red-600 sm:block">
              회원가입
            </Link>
            {isAdmin ? <span className="hidden text-gray-300 sm:block">|</span> : null}
            {isAdmin ? (
              <Link href="/admin" className="hidden px-2 py-1 text-xs text-gray-600 hover:text-red-600 sm:block">
                관리자
              </Link>
            ) : null}
            <button onClick={() => setMobileMenuOpen((current) => !current)} className="p-1.5 text-gray-600 md:hidden">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden border-t border-blue-800 bg-[#3b5998] md:block">
        <div className="mx-auto max-w-[1400px] px-3">
          <ul className="flex items-center text-base font-bold text-white">
            <li><Link href="/?view=list" className="block px-6 py-3 transition-colors hover:bg-blue-800 hover:text-yellow-300">지역별 업소</Link></li>
            <li><Link href="/?view=theme" className="block px-6 py-3 transition-colors hover:bg-blue-800 hover:text-yellow-300">테마별 업소</Link></li>
            <li><Link href="/top100" className="block px-6 py-3 text-yellow-100 transition-colors hover:bg-blue-800 hover:text-yellow-300">TOP 100</Link></li>
            <li><Link href="/board" className="block px-6 py-3 transition-colors hover:bg-blue-800 hover:text-yellow-300">커뮤니티</Link></li>
            <li><Link href="/board/qna" className="block px-6 py-3 transition-colors hover:bg-blue-800 hover:text-yellow-300">Q&amp;A</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto hidden max-w-[1400px] px-3 md:block">
        <nav className="-mx-3 flex items-center overflow-x-auto border-t border-gray-200 px-3 scrollbar-hide">
          {REGIONS.filter((region) => region.code !== 'all').map((region) => (
            <Link
              key={region.code}
              href={`/?region=${region.code}`}
              className={clsx(
                'shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-all',
                currentRegion === region.code
                  ? 'border-red-600 bg-red-50 text-red-600'
                  : 'border-transparent text-gray-700 hover:bg-red-50 hover:text-red-600',
              )}
            >
              {region.label}
            </Link>
          ))}
          <div className="mx-1 h-4 w-px self-center bg-gray-300" />
          {THEMES.filter((theme) => theme.code !== 'all').slice(0, 5).map((theme) => (
            <Link
              key={theme.code}
              href={`/?theme=${theme.code}`}
              className="shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-gray-500 transition-all hover:bg-red-50 hover:text-red-600"
            >
              {theme.label}
            </Link>
          ))}
        </nav>

        {currentRegion && DISTRICTS[currentRegion] ? (
          <div className="mb-2 grid grid-cols-8 gap-x-2 gap-y-2 rounded border border-gray-200 bg-gray-50 p-3">
            {DISTRICTS[currentRegion].map((district) => (
              <Link
                key={district.code}
                href={`/?region=${currentRegion}&subRegion=${district.code}`}
                className={clsx(
                  'rounded py-1 text-center text-[13px]',
                  district.code === 'all' && (!currentSubRegion || currentSubRegion === 'all')
                    ? 'bg-red-500 font-bold text-white'
                    : currentSubRegion === district.code
                      ? 'bg-red-500 font-bold text-white'
                      : 'text-gray-700 hover:bg-gray-200',
                )}
              >
                {district.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-gray-200 bg-white shadow-lg md:hidden">
          <form onSubmit={handleSearch} className="space-y-2 border-b border-gray-100 p-3">
            <select
              value={selectedRegion}
              onChange={(event) => setSelectedRegion(event.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            >
              <option value="all">전체 지역</option>
              {REGIONS.filter((region) => region.code !== 'all').map((region) => (
                <option key={region.code} value={region.code}>
                  {region.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="검색어 입력"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </form>
          <div className="space-y-4 p-3">
            <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-gray-700">
              <Link href="/?view=list" onClick={() => setMobileMenuOpen(false)} className="rounded border border-gray-200 px-3 py-2 hover:border-red-300 hover:bg-red-50 hover:text-red-600">
                지역별 업소
              </Link>
              <Link href="/?view=theme" onClick={() => setMobileMenuOpen(false)} className="rounded border border-gray-200 px-3 py-2 hover:border-red-300 hover:bg-red-50 hover:text-red-600">
                테마별 업소
              </Link>
              <Link href="/top100" onClick={() => setMobileMenuOpen(false)} className="rounded border border-gray-200 px-3 py-2 hover:border-red-300 hover:bg-red-50 hover:text-red-600">
                TOP 100
              </Link>
              <Link href="/board" onClick={() => setMobileMenuOpen(false)} className="rounded border border-gray-200 px-3 py-2 hover:border-red-300 hover:bg-red-50 hover:text-red-600">
                커뮤니티
              </Link>
            </div>

            {isAdmin ? (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              >
                관리자
              </Link>
            ) : null}

            {currentRegion && DISTRICTS[currentRegion] ? (
              <div>
                <p className="mb-2 text-xs font-bold text-gray-400">세부 지역</p>
                <div className="flex flex-wrap gap-1">
                  {DISTRICTS[currentRegion]
                    .filter((district) => district.code !== 'all')
                    .map((district) => (
                      <Link
                        key={district.code}
                        href={`/?region=${currentRegion}&subRegion=${district.code}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={clsx(
                          'rounded border px-2.5 py-1 text-xs',
                          currentSubRegion === district.code
                            ? 'border-red-600 bg-red-50 text-red-600'
                            : 'border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600',
                        )}
                      >
                        {district.label}
                      </Link>
                    ))}
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-bold text-gray-400">테마</p>
              <div className="flex flex-wrap gap-1">
                {THEMES.filter((theme) => theme.code !== 'all').map((theme) => (
                  <Link
                    key={theme.code}
                    href={`/?theme=${theme.code}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    {theme.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
