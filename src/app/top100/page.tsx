'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List as ListIcon, RefreshCw, Trophy } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ShopCard from '@/components/ShopCard';
import type { Shop } from '@/lib/types';

type ShopsResponse = {
  allShops?: Shop[];
};

function Top100Content() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedRegion = searchParams.get('region') ?? 'all';
  const selectedSubRegion = searchParams.get('subRegion') ?? 'all';
  const selectedTheme = searchParams.get('theme') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTopShops() {
      setLoading(true);
      setLoadError(null);

      const params = new URLSearchParams();
      if (selectedRegion !== 'all') params.set('region', selectedRegion);
      if (selectedSubRegion !== 'all') params.set('subRegion', selectedSubRegion);
      if (selectedTheme !== 'all') params.set('theme', selectedTheme);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      try {
        const response = await fetch(`/api/shops?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const result = (await response.json()) as ShopsResponse;

        if (!response.ok || !result.allShops) {
          throw new Error('TOP 100 ???? ???? ?????.');
        }

        const ranked = [...result.allShops].sort((left, right) => {
          if (right.reviewCount !== left.reviewCount) return right.reviewCount - left.reviewCount;
          if (right.rating !== left.rating) return right.rating - left.rating;
          return `${left.id}-${refreshNonce}`.localeCompare(`${right.id}-${refreshNonce}`);
        });

        setShops(ranked.slice(0, 100));
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : 'TOP 100 ???? ???? ?????.');
          setShops([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTopShops();
    return () => controller.abort();
  }, [refreshNonce, searchQuery, selectedRegion, selectedSubRegion, selectedTheme]);

  const helperText = useMemo(() => {
    if (loading) return '??? ??? ???? ????.';
    if (loadError) return loadError;
    return '?? ?? ??? ???? ??? ?????.';
  }, [loadError, loading]);

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
                <h1 className="text-xl font-black">?? 100</h1>
                <p className="text-sm text-white/80">{helperText}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setRefreshNonce((current) => current + 1);
                router.refresh();
              }}
              className="hidden items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-bold hover:bg-white/30 sm:flex"
            >
              <RefreshCw className="h-4 w-4" />
              ????
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-black text-gray-800">?? ?? ({shops.length})</span>
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

            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400">TOP 100 ???? ???? ????.</div>
            ) : loadError ? (
              <div className="py-16 text-center text-sm text-red-500">{loadError}</div>
            ) : shops.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">?? ??? ?? ?? ??? ????.</div>
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
