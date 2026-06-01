'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, LayoutGrid, List as ListIcon, Trophy } from 'lucide-react';
import { MOCK_SHOPS } from '@/lib/mockData';
import { filterShops, sortShopsByPopularity } from '@/lib/utils';
import { Shop, REGIONS, THEMES, DISTRICTS } from '@/lib/types';
import ShopCard from '@/components/ShopCard';
import Sidebar from '@/components/Sidebar';

function Top100Content() {
  const searchParams = useSearchParams();
  const selectedRegion = searchParams.get('region') ?? 'all';
  const selectedSubRegion = searchParams.get('subRegion') ?? 'all';
  const selectedTheme = searchParams.get('theme') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';

  const [shops, setShops] = useState<Shop[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'card'|'list'>('card');

  const updateData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const filtered = filterShops(MOCK_SHOPS, selectedRegion, selectedSubRegion, selectedTheme, searchQuery);
      // 인기순 정렬
      const sorted = sortShopsByPopularity(filtered);
      setShops(sorted.slice(0, 100)); // TOP 100
      setIsRefreshing(false);
    }, 200);
  };

  useEffect(() => { updateData(); }, [selectedRegion, selectedSubRegion, selectedTheme, searchQuery]);

  const regionLabel = REGIONS.find(r => r.code === selectedRegion)?.label ?? '전체';
  const subRegionLabel = selectedRegion !== 'all' && selectedSubRegion !== 'all'
    ? (DISTRICTS[selectedRegion]?.find(d => d.code === selectedSubRegion)?.label ?? '')
    : '';
  const themeLabel = THEMES.find(t => t.code === selectedTheme)?.label;

  const filterTitle = `${regionLabel}${subRegionLabel ? ' ' + subRegionLabel : ''}${themeLabel ? ' ' + themeLabel : ''}`;

  return (
    <div className="max-w-[1400px] mx-auto px-3 py-3">
      <div className="flex gap-3">
        <Sidebar />

        <div className="flex-1 min-w-0">
          {/* 메인 배너 (홈과 동일한 빨간색 테마) */}
          <div className="bg-gradient-to-r from-red-600 to-rose-500 rounded-lg mb-4 p-5 flex items-center justify-between text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Trophy className="w-8 h-8 text-yellow-300" />
              </div>
              <div>
                <h1 className="font-black text-xl flex items-center gap-2">
                  🔥 {filterTitle === '전체' ? '' : filterTitle} 인기순위 TOP 100
                </h1>
                <p className="text-sm text-white/80 mt-1">리뷰수와 평점을 기반으로 선정된 실시간 인기 업소입니다.</p>
              </div>
            </div>
            <button
              onClick={updateData}
              disabled={isRefreshing}
              className="hidden sm:flex items-center gap-1.5 text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>

          {/* 리스트 헤더 */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-gray-800">
                  🏆 {filterTitle === '전체' ? '전국' : filterTitle} 랭킹
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">({shops.length}개)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {shops.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                해당 조건의 인기 업소가 없습니다.
              </div>
            ) : (
              <div className={`shop-grid transition-opacity duration-200 ${isRefreshing ? 'opacity-30' : 'opacity-100'} ${viewMode === 'list' ? 'list-view' : 'card-view'}`}>
                {shops.map((shop, idx) => (
                  <div key={shop.id} className="relative group">
                    {/* 랭킹 뱃지 */}
                    <div className={`absolute -left-1.5 -top-1.5 z-20 w-9 h-9 flex items-center justify-center font-black text-white rounded-lg shadow-lg border-2 border-white text-xs tracking-tighter ${
                      idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 scale-110' :
                      idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700' :
                      'bg-gray-800'
                    }`}>
                      {idx + 1}
                    </div>
                    <ShopCard shop={shop} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 하단 안내 */}
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 text-[11px] text-gray-400 leading-relaxed">
            <p>· 인기순위는 실제 유저들의 리뷰 개수와 평점을 종합하여 실시간으로 산정됩니다.</p>
            <p>· 깨끗하고 건전한 마사지 문화를 위해 허위 리뷰가 발견될 경우 순위에서 제외될 수 있습니다.</p>
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
