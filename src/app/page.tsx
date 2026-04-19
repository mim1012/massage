'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Crown, RefreshCw, Shuffle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ShopCard from '@/components/ShopCard';
import { REGIONS, THEMES, DISTRICTS, type Shop } from '@/lib/types';

type ShopListResponse = {
  allShops: Shop[];
  premiumShops: Shop[];
  regularShops: Shop[];
  total: number;
};

function shuffleRegularShops(shops: Shop[]) {
  const copy = [...shops];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const selectedRegion = searchParams.get('region') ?? 'all';
  const selectedSubRegion = searchParams.get('subRegion') ?? 'all';
  const selectedTheme = searchParams.get('theme') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';

  const [premiumShops, setPremiumShops] = useState<Shop[]>([]);
  const [regularShops, setRegularShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const loadShops = useCallback(async (shuffleRegular = false) => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (selectedRegion !== 'all') params.set('region', selectedRegion);
    if (selectedSubRegion !== 'all') params.set('subRegion', selectedSubRegion);
    if (selectedTheme !== 'all') params.set('theme', selectedTheme);
    if (searchQuery) params.set('q', searchQuery);

    try {
      const response = await fetch(`/api/shops?${params.toString()}`);
      const result = (await response.json()) as Partial<ShopListResponse> & { error?: string };

      if (!response.ok) {
        setError(result.error ?? 'Failed to load shops.');
        return;
      }

      setPremiumShops(result.premiumShops ?? []);
      setRegularShops(
        shuffleRegular
          ? shuffleRegularShops(result.regularShops ?? [])
          : result.regularShops ?? [],
      );
      setTotal(result.total ?? 0);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedRegion, selectedSubRegion, selectedTheme]);

  useEffect(() => {
    void loadShops(true);
  }, [loadShops]);

  const regionLabel = REGIONS.find((region) => region.code === selectedRegion)?.label ?? 'All';
  const subRegionLabel =
    selectedRegion !== 'all' && selectedSubRegion !== 'all'
      ? DISTRICTS[selectedRegion]?.find((district) => district.code === selectedSubRegion)?.label ?? ''
      : '';
  const themeLabel = THEMES.find((theme) => theme.code === selectedTheme)?.label;

  return (
    <div className="max-w-[1400px] mx-auto px-3 py-3">
      <div className="flex gap-3">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <div className="bg-gradient-to-r from-red-600 to-rose-500 rounded mb-3 p-3 flex items-center justify-between text-white">
            <div>
              <p className="font-black text-sm">
                {regionLabel}
                {' '}
                {subRegionLabel}
                {' '}
                curated shops
                {themeLabel && ` · ${themeLabel}`}
              </p>
              <p className="text-[11px] text-white/80 mt-0.5">
                {total}
                {' '}
                visible shops
              </p>
            </div>
            <button
              onClick={() => void loadShops(true)}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="md:hidden flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              href="/"
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                !searchParams.get('region') && !searchParams.get('theme')
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-gray-300 text-gray-600 bg-white'
              }`}
            >
              All
            </Link>
            {REGIONS.filter((region) => region.code !== 'all').map((region) => (
              <Link
                key={region.code}
                href={`/?region=${region.code}`}
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  selectedRegion === region.code
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-gray-300 text-gray-600 bg-white'
                }`}
              >
                {region.label}
              </Link>
            ))}
          </div>

          {premiumShops.length > 0 && (
            <div className="premium-box mb-3 p-2.5">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-amber-700">Premium spots</span>
                <div className="flex-1 h-px bg-amber-200" />
                <span className="text-[10px] text-amber-500">ad</span>
              </div>

              <div className="space-y-2">
                {premiumShops.map((shop) => (
                  <Link
                    key={shop.id}
                    href={`/shop/${shop.slug}`}
                    className="banner-item flex bg-white border border-amber-200 rounded overflow-hidden hover:border-red-500"
                  >
                    <div className="w-24 sm:w-32 shrink-0 bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center">
                      <span className="text-sm font-bold text-amber-700">{shop.themeLabel}</span>
                    </div>
                    <div className="flex-1 p-2 sm:p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                              AD
                            </span>
                            <h3 className="text-sm font-bold text-gray-900 truncate">{shop.name}</h3>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1">{shop.tagline}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{shop.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded p-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-800">Visible shops</span>
                <span className="text-[10px] text-gray-400">({regularShops.length})</span>
              </div>
              <button
                onClick={() => setRegularShops((current) => shuffleRegularShops(current))}
                disabled={isLoading}
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <Shuffle className="w-3 h-3" />
                Shuffle
              </button>
            </div>

            {error ? (
              <div className="text-center py-12 text-red-500 text-sm">{error}</div>
            ) : regularShops.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No shops match this filter.</div>
            ) : (
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 transition-opacity duration-200 ${
                  isLoading ? 'opacity-30' : 'opacity-100'
                }`}
              >
                {regularShops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <HomeContent />
    </Suspense>
  );
}
