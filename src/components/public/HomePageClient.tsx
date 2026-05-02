'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Crown,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  RefreshCw,
  Shuffle,
  Star,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ShopCard from '@/components/ShopCard';
import HomeUtilityRail from '@/components/public/HomeUtilityRail';
import MobileBannerRail from '@/components/public/MobileBannerRail';
import { DISTRICTS, REGIONS, THEMES } from '@/lib/catalog';
import { buildShopDetailHref } from '@/lib/browse-context';
import { deriveStructuredSearchIntent } from '@/lib/structured-search';
import { buildBrowseHref, getDirectoryMode } from '@/lib/directory-mode';
import { getDirectorySortType, sortRegularShops } from '@/lib/directory-sort';
import type { HomeSeoContent, Shop, SiteSettings } from '@/lib/types';
import { formatRating } from '@/lib/utils';

type ShopListResponse = {
  allShops: Shop[];
  premiumShops: Shop[];
  regularShops: Shop[];
  regularTotal?: number;
  total: number;
};

type ViewMode = 'card' | 'list';

const themeEmoji: Record<string, string> = {
  swedish: '🌿',
  aroma: '🌸',
  thai: '🙏',
  sport: '💪',
  deep: '🔥',
  hot_stone: '💎',
  foot: '🦶',
  couple: '👫',
};

const REGULAR_PAGE_SIZE = 24;

export default function HomePageClient({
  initialPremiumShops,
  initialRegularShops,
  initialRegularTotal,
  initialSiteSettings,
  initialHomeSeo,
}: {
  initialPremiumShops: Shop[];
  initialRegularShops: Shop[];
  initialRegularTotal: number;
  initialSiteSettings: SiteSettings;
  initialHomeSeo: HomeSeoContent;
}) {
  const searchParams = useSearchParams();
  const selectedRegion = searchParams.get('region') ?? 'all';
  const selectedSubRegion = searchParams.get('subRegion') ?? 'all';
  const selectedTheme = searchParams.get('theme') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';
  const sortType = getDirectorySortType(searchParams.get('sort'));
  const directoryMode = getDirectoryMode(searchParams.get('view'));
  const viewParam = searchParams.get('viewMode') === 'list' ? 'list' : 'card';

  const [premiumShops, setPremiumShops] = useState<Shop[]>(initialPremiumShops);
  const [regularShops, setRegularShops] = useState<Shop[]>(initialRegularShops);
  const [regularTotal, setRegularTotal] = useState(initialRegularTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(viewParam);

  const loadShops = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    const searchIntent = deriveStructuredSearchIntent(searchQuery);
    const resolvedRegion = selectedRegion !== 'all' ? selectedRegion : searchIntent.region;
    const resolvedSubRegion = selectedSubRegion !== 'all' ? selectedSubRegion : searchIntent.subRegion;
    const resolvedTheme = selectedTheme !== 'all' ? selectedTheme : searchIntent.theme;
    if (resolvedRegion && resolvedRegion !== 'all') params.set('region', resolvedRegion);
    if (resolvedSubRegion && resolvedSubRegion !== 'all') params.set('subRegion', resolvedSubRegion);
    if (resolvedTheme && resolvedTheme !== 'all') params.set('theme', resolvedTheme);
    if (searchIntent.freeText) params.set('q', searchIntent.freeText);
    params.set('sort', sortType);
    params.set('regularOffset', '0');
    params.set('regularLimit', String(REGULAR_PAGE_SIZE));

    try {
      const response = await fetch(`/api/shops?${params.toString()}`, { cache: 'no-store' });
      const result = (await response.json()) as Partial<ShopListResponse> & { error?: string };

      if (!response.ok) {
        setError(result.error ?? '업소 목록을 불러오지 못했습니다.');
        return;
      }

      setPremiumShops((result.premiumShops ?? []).slice(0, 4));
      setRegularShops(result.regularShops ?? []);
      setRegularTotal(result.regularTotal ?? result.regularShops?.length ?? 0);
    } catch {
      setError('업소 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedRegion, selectedSubRegion, selectedTheme, sortType]);

  const loadMoreShops = useCallback(async () => {
    setIsLoadingMore(true);
    setError(null);

    const params = new URLSearchParams();
    const searchIntent = deriveStructuredSearchIntent(searchQuery);
    const resolvedRegion = selectedRegion !== 'all' ? selectedRegion : searchIntent.region;
    const resolvedSubRegion = selectedSubRegion !== 'all' ? selectedSubRegion : searchIntent.subRegion;
    const resolvedTheme = selectedTheme !== 'all' ? selectedTheme : searchIntent.theme;
    if (resolvedRegion && resolvedRegion !== 'all') params.set('region', resolvedRegion);
    if (resolvedSubRegion && resolvedSubRegion !== 'all') params.set('subRegion', resolvedSubRegion);
    if (resolvedTheme && resolvedTheme !== 'all') params.set('theme', resolvedTheme);
    if (searchIntent.freeText) params.set('q', searchIntent.freeText);
    params.set('sort', sortType);
    params.set('regularOffset', String(regularShops.length));
    params.set('regularLimit', String(REGULAR_PAGE_SIZE));

    try {
      const response = await fetch(`/api/shops?${params.toString()}`, { cache: 'no-store' });
      const result = (await response.json()) as Partial<ShopListResponse> & { error?: string };

      if (!response.ok) {
        setError(result.error ?? '업소 목록을 불러오지 못했습니다.');
        return;
      }

      setRegularShops((current) => [...current, ...(result.regularShops ?? [])]);
      setRegularTotal(result.regularTotal ?? regularTotal);
    } catch {
      setError('업소 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [regularShops.length, regularTotal, searchQuery, selectedRegion, selectedSubRegion, selectedTheme, sortType]);

  useEffect(() => {
    setViewMode(viewParam);
  }, [viewParam]);

  useEffect(() => {
    setPremiumShops(initialPremiumShops);
    setRegularShops(initialRegularShops);
    setRegularTotal(initialRegularTotal);
    setError(null);
  }, [initialPremiumShops, initialRegularShops, initialRegularTotal]);

  const regionLabel = useMemo(
    () => REGIONS.find((region) => region.code === selectedRegion)?.label ?? '전체',
    [selectedRegion],
  );
  const isAllCategorySelected = selectedRegion === 'all' && selectedTheme === 'all';
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

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-3">
      <div className="flex gap-3">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-[var(--portal-brand-dark)] to-[var(--portal-brand)] p-4 text-white shadow-md">
            <div>
              <p className="text-base font-black">{initialSiteSettings.heroMainText}</p>
              <p className="mt-0.5 text-sm text-white/80">{initialSiteSettings.heroSubText}</p>
            </div>
            <button
              onClick={() => void loadShops()}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-bold transition-all hover:bg-white/30 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>

          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide md:hidden">
            <Link
              href="/"
              prefetch={false}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                isAllCategorySelected
                  ? 'border-[var(--portal-brand)] bg-[var(--portal-brand)] text-white'
                  : 'border-gray-300 bg-white text-gray-600'
              }`}
            >
              전체
            </Link>
            {REGIONS.filter((region) => region.code !== 'all').map((region) => (
              <Link
                key={region.code}
                href={buildBrowseHref({ mode: 'region', region: region.code })}
                prefetch={false}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  selectedRegion === region.code
                    ? 'border-[var(--portal-brand)] bg-[var(--portal-brand)] text-white'
                    : 'border-gray-300 bg-white text-gray-600'
                }`}
              >
                {region.label}
              </Link>
            ))}
          </div>

          <MobileBannerRail />

          {premiumShops.length > 0 && (
            <div className="premium-box mb-4 p-3">
              <div className="mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-black text-amber-700">PREMIUM 추천업소</span>
                <div className="h-px flex-1 bg-amber-200" />
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-500">광고 · 최대 4개</span>
              </div>

              <div className="premium-shop-grid">
                {premiumShops.map((shop) => (
                  <Link
                    key={shop.id}
                    href={buildShopDetailHref(shop.slug, {
                      mode: directoryMode,
                      region: selectedRegion !== 'all' ? selectedRegion : undefined,
                      subRegion: selectedSubRegion !== 'all' ? selectedSubRegion : undefined,
                      theme: selectedTheme !== 'all' ? selectedTheme : undefined,
                    })}
                    prefetch={false}
                    className="premium-shop-card flex overflow-hidden rounded-2xl border-2 border-amber-300 bg-white transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div
                      className="premium-shop-media flex aspect-[4/3] shrink-0 items-center justify-center border-amber-100 bg-gradient-to-br from-amber-100 to-orange-50 bg-cover bg-center"
                      style={shop.bannerUrl?.trim() ? { backgroundImage: `url(${shop.bannerUrl})` } : undefined}
                    >
                      {!shop.bannerUrl?.trim() ? (
                        <span className="text-6xl opacity-50 sm:text-7xl">{themeEmoji[shop.theme] ?? '✨'}</span>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
                      <div className="mb-2 flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <div className="mb-1 flex items-center gap-1.5">
                            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-white sm:text-xs">AD</span>
                            <h3 className="truncate text-base font-bold text-gray-900 sm:text-lg">{shop.name}</h3>
                          </div>
                          <p className="line-clamp-1 text-xs text-gray-500 sm:text-sm">{shop.tagline}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          <span className="text-sm font-bold text-amber-700">{formatRating(shop.rating)}</span>
                        </div>
                      </div>
                      <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3.5 w-3.5 text-[var(--portal-brand)]" />
                          {shop.regionLabel}
                        </span>
                        <span className="font-medium text-[var(--portal-brand)]">#{shop.themeLabel}</span>
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {shop.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 sm:text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                        {shop.courses[0] ? (
                          <span className="text-sm font-black text-[var(--portal-brand)] sm:text-base">{shop.courses[0].price}~</span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-gray-800">
                  📋 {sortType === 'popular' ? '인기 추천 업소' : '전체 업소'}
                  {regionLabel !== '전체' && ` · ${regionLabel} ${subRegionLabel}`}
                  {themeLabel && ` · ${themeLabel}`}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                  ({regularShops.length}/{regularTotal}개)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {sortType === 'popular' && (
                  <Link
                    href={buildBrowseHref({
                      mode: directoryMode,
                      region: selectedRegion,
                      subRegion: selectedSubRegion,
                      theme: selectedTheme,
                    })}
                    prefetch={false}
                    className="text-[11px] font-bold text-[var(--portal-brand)] hover:underline"
                  >
                    정렬 초기화
                  </Link>
                )}
                <div className="mr-1 flex rounded-lg bg-gray-100 p-0.5 md:mr-2">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`rounded-md p-1.5 transition-colors ${
                      viewMode === 'card'
                        ? 'bg-white text-[var(--portal-brand)] shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    aria-label="카드형 보기"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-md p-1.5 transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-[var(--portal-brand)] shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    aria-label="리스트형 보기"
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => setRegularShops((current) => sortRegularShops(current, sortType))}
                  disabled={isLoading}
                  className="flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)] disabled:opacity-50"
                >
                  <Shuffle className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  랜덤
                </button>
              </div>
            </div>

            {error ? (
              <div className="py-16 text-center text-sm text-red-500">{error}</div>
            ) : regularShops.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">해당 조건의 업소가 없습니다.</div>
            ) : (
              <>
                <div
                  className={`shop-grid transition-opacity duration-200 ${
                    isLoading ? 'opacity-30' : 'opacity-100'
                  } ${viewMode === 'list' ? 'list-view' : 'card-view'}`}
                >
                  {regularShops.map((shop) => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      detailHref={buildShopDetailHref(shop.slug, {
                        mode: directoryMode,
                        region: selectedRegion === shop.region ? selectedRegion : undefined,
                        subRegion:
                          shop.subRegion && selectedSubRegion === shop.subRegion ? selectedSubRegion : undefined,
                        theme: selectedTheme === shop.theme ? selectedTheme : undefined,
                      })}
                    />
                  ))}
                </div>
                {regularShops.length < regularTotal ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => void loadMoreShops()}
                      disabled={isLoadingMore}
                      className="rounded-lg border border-[var(--portal-brand)] bg-white px-5 py-2 text-sm font-bold text-[var(--portal-brand)] transition-colors hover:bg-[var(--portal-brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoadingMore ? '불러오는 중...' : `더보기 (${regularTotal - regularShops.length}개 남음)`}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="seo-content mt-6 rounded-lg border border-gray-200 bg-white p-5">
            <h1 className="mb-3 text-xl font-bold">{initialHomeSeo.section1Title}</h1>
            <p className="mb-6 text-sm leading-relaxed text-gray-600">{initialHomeSeo.section1Content}</p>

            <h2 className="mb-2 text-lg font-bold">{initialHomeSeo.section2Title}</h2>
            <p className="mb-6 text-sm leading-relaxed text-gray-600">{initialHomeSeo.section2Content}</p>

            <h2 className="mb-2 text-lg font-bold">{initialHomeSeo.section3Title}</h2>
            <p className="text-sm leading-relaxed text-gray-600">{initialHomeSeo.section3Content}</p>
          </div>

        </div>

        <aside className="hidden w-[120px] shrink-0 lg:block">
          <HomeUtilityRail mode="sidebar" directoryMode={directoryMode} />
        </aside>
      </div>
    </div>
  );
}
