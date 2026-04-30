'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, List as ListIcon, RefreshCw, Trophy } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ShopCard from '@/components/ShopCard';
import MobilePromoBanners from '@/components/public/MobilePromoBanners';
import { DISTRICTS, REGIONS, THEMES } from '@/lib/catalog';
import { getTop100FilterTitle, getTop100RankingLabel } from '@/lib/browse-context';
import { buildTop100PageData } from '@/lib/public-page-data';
import type { Shop } from '@/lib/types';

type ShopListResponse = {
  allShops: Shop[];
  premiumShops: Shop[];
  regularShops: Shop[];
  total: number;
};

export default function Top100PageClient({ initialShops }: { initialShops: Shop[] }) {
  const searchParams = useSearchParams();
  const selectedRegion = searchParams.get('region') ?? 'all';
  const selectedSubRegion = searchParams.get('subRegion') ?? 'all';
  const selectedTheme = searchParams.get('theme') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';

  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const updateData = useCallback(async () => {
    setIsRefreshing(true);

    const params = new URLSearchParams();
    if (selectedRegion !== 'all') params.set('region', selectedRegion);
    if (selectedSubRegion !== 'all') params.set('subRegion', selectedSubRegion);
    if (selectedTheme !== 'all') params.set('theme', selectedTheme);
    if (searchQuery) params.set('q', searchQuery);

    try {
      const response = await fetch(`/api/shops?${params.toString()}`, { cache: 'no-store' });
      const result = (await response.json()) as Partial<ShopListResponse> & { error?: string };

      if (!response.ok) {
        setShops([]);
        return;
      }

      setShops(
        buildTop100PageData({
          allShops: result.allShops ?? [],
          premiumShops: result.premiumShops ?? [],
          regularShops: result.regularShops ?? [],
          total: result.total ?? (result.allShops ?? []).length,
        }),
      );
    } catch {
      setShops([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedRegion, selectedSubRegion, selectedTheme]);

  useEffect(() => {
    setShops(initialShops);
  }, [initialShops]);

  const regionLabel = useMemo(
    () => REGIONS.find((region) => region.code === selectedRegion)?.label ?? '전체',
    [selectedRegion],
  );
  const subRegionLabel = useMemo(() => {
    if (selectedRegion === 'all' || selectedSubRegion === 'all') {
      return '';
    }

    return DISTRICTS[selectedRegion]?.find((district) => district.code === selectedSubRegion)?.label ?? '';
  }, [selectedRegion, selectedSubRegion]);
  const themeLabel = useMemo(
    () => THEMES.find((theme) => theme.code === selectedTheme)?.label,
    [selectedTheme],
  );

  const filterTitle = getTop100FilterTitle({
    regionLabel,
    subRegionLabel,
    themeLabel,
  });

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-3">
      <div className="flex gap-3">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-red-600 to-rose-500 p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <Trophy className="h-8 w-8 text-yellow-300" />
              </div>
              <div>
                <h1 className="flex items-center gap-2 text-xl font-black">
                  🔥 {filterTitle === '전체' ? '' : filterTitle} 인기순위 TOP 100
                </h1>
                <p className="mt-1 text-sm text-white/80">리뷰수와 평점을 기반으로 선정된 실시간 인기 업소입니다.</p>
              </div>
            </div>
            <button
              onClick={() => void updateData()}
              disabled={isRefreshing}
              className="hidden items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-bold transition-all hover:bg-white/30 disabled:opacity-50 sm:flex"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-gray-800">
                  🏆 {getTop100RankingLabel(filterTitle)} 랭킹
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">({shops.length}개)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-gray-100 p-0.5">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`rounded-md p-1.5 transition-colors ${viewMode === 'card' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {shops.length === 0 ? (
              <div className="py-20 text-center text-sm text-gray-400">해당 조건의 인기 업소가 없습니다.</div>
            ) : (
              <div
                className={`shop-grid transition-opacity duration-200 ${isRefreshing ? 'opacity-30' : 'opacity-100'} ${viewMode === 'list' ? 'list-view' : 'card-view'}`}
              >
                {shops.map((shop, idx) => (
                  <div key={shop.id} className="group relative">
                    <div
                      className={`absolute -left-1.5 -top-1.5 z-20 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white text-xs font-black tracking-tighter text-white shadow-lg ${
                        idx === 0
                          ? 'scale-110 bg-gradient-to-br from-yellow-400 to-amber-600'
                          : idx === 1
                            ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                            : idx === 2
                              ? 'bg-gradient-to-br from-orange-400 to-orange-700'
                              : 'bg-gray-800'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <ShopCard shop={shop} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <MobilePromoBanners />

          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-[11px] leading-relaxed text-gray-400">
            <p>· 인기순위는 실제 유저들의 리뷰 개수와 평점을 종합하여 실시간으로 산정됩니다.</p>
            <p>· 깨끗하고 건전한 마사지 문화를 위해 허위 리뷰가 발견될 경우 순위에서 제외될 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
