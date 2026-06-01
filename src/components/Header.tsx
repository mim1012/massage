'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X, ChevronDown } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { REGIONS, THEMES, DISTRICTS } from '@/lib/types';
import { MOCK_SITE_SETTINGS } from '@/lib/mockData';
import clsx from 'clsx';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentRegion = searchParams.get('region');
  const currentSubRegion = searchParams.get('subRegion');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedRegion !== 'all') params.set('region', selectedRegion);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    router.push(`/?${params.toString()}`);
  };

  return (
    <header className="bg-[#FCF9F5] border-b-2 border-[#D4A373] shadow-sm sticky top-0 z-50">
      {/* 최상단 공지 바 */}
      <div className="bg-[#D4A373] text-white text-center text-xs py-1 font-medium">
        🎁 제휴업소 입점 문의 환영! &nbsp;|&nbsp; 프리미엄 배너 광고 진행중 &nbsp;|&nbsp; ☎ {MOCK_SITE_SETTINGS.contactPhone}
      </div>

      {/* 메인 헤더 */}
      <div className="max-w-[1400px] mx-auto px-3">
        <div className="flex items-center h-14 gap-3">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <div className="w-8 h-8 rounded bg-[#D4A373] flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">{MOCK_SITE_SETTINGS.siteName[0]}</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="text-[#D4A373] font-black text-base">{MOCK_SITE_SETTINGS.siteName}</span>
              <span className="text-gray-400 text-[10px] block -mt-0.5">{MOCK_SITE_SETTINGS.siteDescription}</span>
            </div>
          </Link>

          {/* ===== 검색: 지역 + 키워드 ===== */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
            <div className="flex gap-0 border border-gray-300 rounded-lg overflow-hidden focus-within:border-[#D4A373] focus-within:ring-1 focus-within:ring-[#D4A373]/30 shadow-sm transition-all">
              {/* 지역 선택 */}
              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                className="shrink-0 pl-2.5 pr-1 py-2 text-sm bg-gray-50 border-r border-gray-200 text-gray-700 focus:outline-none"
              >
                <option value="all">전체지역</option>
                {REGIONS.filter(r => r.code !== 'all').map(r => (
                  <option key={r.code} value={r.code}>{r.label}</option>
                ))}
              </select>
              {/* 키워드 입력 */}
              <input
                type="text"
                placeholder="업소명, 테마 검색"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 pl-3 pr-2 py-2 text-sm focus:outline-none bg-white min-w-0"
              />
              <button type="submit" className="shrink-0 px-3 bg-[#D4A373] text-white hover:bg-[#C29262] transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* 우측 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link href="/auth/login" className="text-xs text-gray-600 hover:text-[#D4A373] px-2 py-1 hidden sm:block">로그인</Link>
            <span className="text-gray-300 hidden sm:block">|</span>
            <Link href="/auth/register" className="text-xs text-gray-600 hover:text-[#D4A373] px-2 py-1 hidden sm:block">회원가입</Link>
            <span className="text-gray-300 hidden sm:block">|</span>
            <Link href="/admin" className="text-xs text-gray-600 hover:text-[#D4A373] px-2 py-1 hidden sm:block">관리자</Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-gray-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* GNB (메뉴 상단바) - 포근한 세이지 그린 계열로 변경 */}
      <div className="hidden md:block bg-[#8B9A67] border-t border-[#7A8956] shadow-md">
        <div className="max-w-[1400px] mx-auto px-3">
          <ul className="flex items-center text-white text-base font-bold">
            <li><Link href="/?view=list" className="block px-6 py-3 hover:bg-[#7A8956] hover:text-[#FEFAE0] transition-colors">지역별업소</Link></li>
            <li><Link href="/?view=theme" className="block px-6 py-3 hover:bg-[#7A8956] hover:text-[#FEFAE0] transition-colors">테마별업소</Link></li>
            <li><Link href="/top100" className="block px-6 py-3 hover:bg-[#7A8956] hover:text-[#FEFAE0] transition-colors text-yellow-100">인기순위</Link></li>
            <li><Link href="/board" className="block px-6 py-3 hover:bg-[#7A8956] hover:text-[#FEFAE0] transition-colors">커뮤니티</Link></li>
            <li><Link href="/board/qna" className="block px-6 py-3 hover:bg-[#7A8956] hover:text-[#FEFAE0] transition-colors">고객센터</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3">
        {/* 지역탭 (PC) */}
        <div className="hidden md:block">
          <nav className="flex items-center border-t border-gray-200 -mx-3 px-3 overflow-x-auto scrollbar-hide bg-white">
            {REGIONS.filter(r => r.code !== 'all').map(region => (
              <Link
                key={region.code}
                href={`/?region=${region.code}`}
                className={clsx(
                  "shrink-0 px-4 py-2 text-sm text-gray-700 hover:text-[#D4A373] hover:bg-[#FEFAE0] border-b-2 font-medium transition-all",
                  currentRegion === region.code ? "border-[#D4A373] text-[#D4A373] bg-[#FEFAE0]" : "border-transparent"
                )}
              >
                {region.label}
              </Link>
            ))}
            <div className="w-px h-4 bg-gray-300 mx-1 self-center" />
            {THEMES.filter(t => t.code !== 'all').slice(0, 5).map(theme => (
              <Link
                key={theme.code}
                href={`/?theme=${theme.code}`}
                className="shrink-0 px-3 py-2 text-sm text-gray-500 hover:text-[#D4A373] hover:bg-[#FEFAE0] transition-all border-b-2 border-transparent"
              >
                {theme.label}
              </Link>
            ))}
          </nav>

          {/* 지역 하위 구 */}
          {currentRegion && DISTRICTS[currentRegion] && (
            <div className="bg-gray-50 border border-gray-200 p-3 mb-2 rounded grid grid-cols-8 gap-y-2 gap-x-2">
              {DISTRICTS[currentRegion].map(district => (
                <Link
                  key={district.code}
                  href={`/?region=${currentRegion}&subRegion=${district.code}`}
                  className={clsx(
                    "text-[13px] text-center rounded py-1",
                    district.code === 'all' && (!currentSubRegion || currentSubRegion === 'all')
                      ? "bg-[#D4A373] text-white font-bold"
                      : currentSubRegion === district.code
                        ? "bg-[#D4A373] text-white font-bold"
                        : "text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {district.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 모바일 드롭다운 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          {/* 모바일 검색: 지역+키워드 */}
          <form onSubmit={handleSearch} className="p-3 border-b border-gray-100 space-y-2">
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:border-[#D4A373] bg-white"
            >
              <option value="all">전체지역</option>
              {REGIONS.filter(r => r.code !== 'all').map(r => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="업소명, 테마 검색"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:border-[#D4A373]"
              />
              <button type="submit" className="px-4 py-2 bg-[#D4A373] text-white rounded text-sm font-bold">검색</button>
            </div>
          </form>
          <div className="p-3">
            <p className="text-xs text-gray-400 font-bold mb-2">테마별</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {THEMES.filter(t => t.code !== 'all').map(t => (
                <Link
                  key={t.code}
                  href={`/?theme=${t.code}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2.5 py-1 rounded border border-gray-200 text-xs text-gray-700 hover:bg-[#FEFAE0] hover:border-[#D4A373] hover:text-[#D4A373]"
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50">로그인</Link>
              <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs bg-[#D4A373] text-white rounded font-semibold hover:bg-[#C29262]">회원가입</Link>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 하단 네비 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around py-1.5">
          {[
            { href: '/', label: '홈', emoji: '🏠' },
            { href: '/?view=list', label: '업소', emoji: '📋' },
            { href: '/board', label: '게시판', emoji: '💬' },
            { href: '/board/qna', label: '고객센터', emoji: '📞' },
            { href: '/auth/login', label: 'MY', emoji: '👤' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-3 py-0.5">
              <span className="text-base">{item.emoji}</span>
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
