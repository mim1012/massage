'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Crown, RefreshCw, Shuffle } from 'lucide-react';
import Sidebar, { RightAdRail } from '@/components/Sidebar';
import ShopCard from '@/components/ShopCard';
import type { Shop } from '@/lib/types';
import { REGIONS } from '@/lib/catalog';
import { useSiteContent } from '@/lib/use-site-content';

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
  const selectedSort = searchParams.get('sort') ?? '';

  const [premiumShops, setPremiumShops] = useState<Shop[]>([]);
  const [regularShops, setRegularShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { siteSettings, homeSeo } = useSiteContent();

  const loadShops = useCallback(async (shuffleRegular = false) => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (selectedRegion !== 'all') params.set('region', selectedRegion);
    if (selectedSubRegion !== 'all') params.set('subRegion', selectedSubRegion);
    if (selectedTheme !== 'all') params.set('theme', selectedTheme);
    if (searchQuery) params.set('q', searchQuery);
    if (selectedSort) params.set('sort', selectedSort);

    try {
      const response = await fetch(`/api/shops?${params.toString()}`);
      const result = (await response.json()) as Partial<ShopListResponse> & { error?: string };

      if (!response.ok) {
        setError(result.error ?? '업소 목록을 불러오지 못했습니다.');
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
  }, [searchQuery, selectedRegion, selectedSort, selectedSubRegion, selectedTheme]);

  useEffect(() => {
    void loadShops(true);
  }, [loadShops]);

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <div className="mb-3 flex items-center justify-between rounded bg-gradient-to-r from-red-600 to-rose-500 p-3 text-white">
            <div>
              <p className="text-sm font-black">{siteSettings.heroMainText}</p>
              <p className="mt-0.5 text-[11px] text-white/80">{siteSettings.heroSubText}</p>
            </div>
            <button
              onClick={() => void loadShops(true)}
              disabled={isLoading}
              className="flex items-center gap-1 rounded bg-white/20 px-3 py-1.5 text-xs font-bold transition-all hover:bg-white/30 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2 md:hidden scrollbar-hide">
            <Link
              href="/"
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                !searchParams.get('region') && !searchParams.get('theme')
                  ? 'border-red-600 bg-red-600 text-white'
                  : 'border-gray-300 bg-white text-gray-600'
              }`}
            >
              전체
            </Link>
            {REGIONS.filter((region) => region.code !== 'all').map((region) => (
              <Link
                key={region.code}
                href={`/?region=${region.code}`}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  selectedRegion === region.code
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-gray-300 bg-white text-gray-600'
                }`}
              >
                {region.label}
              </Link>
            ))}
          </div>

          {premiumShops.length > 0 ? (
            <div className="premium-box mb-3 p-2.5">
              <div className="mb-2 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-black text-amber-700">프리미엄 추천 업소</span>
                <div className="h-px flex-1 bg-amber-200" />
                <span className="text-[10px] text-amber-500">광고</span>
              </div>

              <div className="space-y-2">
                {premiumShops.map((shop) => (
                  <Link
                    key={shop.id}
                    href={`/shop/${shop.slug}`}
                    className="banner-item flex overflow-hidden rounded border border-amber-200 bg-white hover:border-red-500"
                  >
                    <div className="flex w-24 shrink-0 items-center justify-center bg-gradient-to-br from-amber-100 to-orange-50 sm:w-32">
                      <span className="text-sm font-bold text-amber-700">{shop.themeLabel}</span>
                    </div>
                    <div className="min-w-0 flex-1 p-2 sm:p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="mb-0.5 flex items-center gap-1.5">
                            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                              광고
                            </span>
                            <h3 className="truncate text-sm font-bold text-gray-900">{shop.name}</h3>
                          </div>
                          <p className="line-clamp-1 text-xs text-gray-500">{shop.tagline}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{shop.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded border border-gray-200 bg-white p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-800">
                  {selectedSort === 'new' ? '신규 등록 업소' : '프리미엄 업소'}
                </span>
                <span className="text-[10px] text-gray-400">({regularShops.length}/{total})</span>
              </div>
              <button
                onClick={() => setRegularShops((current) => shuffleRegularShops(current))}
                disabled={isLoading}
                className="flex items-center gap-1 text-[10px] text-gray-500 transition-colors hover:text-red-600 disabled:opacity-50"
              >
                <Shuffle className="h-3 w-3" />
                셔플
              </button>
            </div>

            {error ? (
              <div className="py-12 text-center text-sm text-red-500">{error}</div>
            ) : regularShops.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">조건에 맞는 업소가 없습니다.</div>
            ) : (
              <div
                className={`grid grid-cols-2 gap-2 transition-opacity duration-200 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${
                  isLoading ? 'opacity-30' : 'opacity-100'
                }`}
              >
                {regularShops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            )}
          </div>

          <div className="seo-content mt-4 rounded border border-gray-200 bg-white p-4">
            <h1>{homeSeo.section1Title}</h1>
            <p>{homeSeo.section1Content}</p>
            <h2>{homeSeo.section2Title}</h2>
            <p>{homeSeo.section2Content}</p>
            <h2>{homeSeo.section3Title}</h2>
            <p>{homeSeo.section3Content}</p>
          </div>
        </div>
        <RightAdRail />
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
