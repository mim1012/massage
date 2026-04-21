'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, List as ListIcon, RefreshCw, Trophy } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ShopCard from '@/components/ShopCard';
import { MOCK_SHOPS } from '@/lib/mockData';
import { filterShops } from '@/lib/utils';

function Top100Content() {
  const searchParams = useSearchParams();
  const selectedRegion = searchParams.get('region') ?? 'all';
  const selectedSubRegion = searchParams.get('subRegion') ?? 'all';
  const selectedTheme = searchParams.get('theme') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [refreshNonce, setRefreshNonce] = useState(0);

  const shops = useMemo(() => {
    const filtered = filterShops(MOCK_SHOPS, selectedRegion, selectedSubRegion, selectedTheme, searchQuery);
    const ranked = [...filtered].sort((left, right) => {
      if (right.reviewCount !== left.reviewCount) return right.reviewCount - left.reviewCount;
      if (right.rating !== left.rating) return right.rating - left.rating;
      return `${left.id}-${refreshNonce}`.localeCompare(`${right.id}-${refreshNonce}`);
    });
    return ranked.slice(0, 100);
  }, [refreshNonce, searchQuery, selectedRegion, selectedSubRegion, selectedTheme]);

  return (
    <div className="max-w-[1400px] mx-auto px-3 py-3">
      <div className="flex gap-3">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <div className="mb-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-red-600 to-rose-500 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <Trophy className="h-7 w-7 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-xl font-black">인기 100</h1>
                <p className="text-sm text-white/80">후기 수와 평점을 기준으로 정렬합니다.</p>
              </div>
            </div>
            <button
              onClick={() => setRefreshNonce((current) => current + 1)}
              className="hidden items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-bold hover:bg-white/30 sm:flex"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-black text-gray-800">순위 업체 ({shops.length})</span>
              <div className="flex rounded-lg bg-gray-100 p-0.5">
                <button
                  onClick={() => setViewMode('card')}
                  className={`rounded-md p-1.5 ${viewMode === 'card' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-md p-1.5 ${viewMode === 'list' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {shops.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">현재 조건에 맞는 순위 업체가 없습니다.</div>
            ) : (
              <div className={`shop-grid ${viewMode === 'list' ? 'list-view' : 'card-view'}`}>
                {shops.map((shop, index) => (
                  <div key={shop.id} className="relative">
                    <div className="absolute -left-1.5 -top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-xs font-black text-white shadow-lg">
                      {index + 1}
                    </div>
                    <ShopCard shop={shop} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Top100Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <Top100Content />
    </Suspense>
  );
}
