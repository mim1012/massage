"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid,
  List as ListIcon,
  MapPin,
  RefreshCw,
  Shuffle,
  Star,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ShopCard from "@/components/ShopCard";
import MobileBannerRail from "@/components/public/MobileBannerRail";
import HomeUtilityRail from "@/components/public/HomeUtilityRail";
import PaginationControls from "@/components/public/PaginationControls";
import { DISTRICTS, REGIONS } from "@/lib/catalog";
import { useThemes } from "@/lib/use-themes";
import { buildShopDetailHref } from "@/lib/browse-context";
import { shouldAutoLoadDeferredHomeDirectory } from "@/lib/home-directory-fetch-strategy";
import {
  buildBrowseHref,
  buildDirectorySearchParams,
  getDirectoryMode,
} from "@/lib/directory-mode";
import { getDirectorySortType, sortRegularShops } from "@/lib/directory-sort";
import type { ShopListItem, SiteSettings } from "@/lib/types";
import { formatRating } from "@/lib/utils";
import { normalizePageParam } from "@/lib/pagination";

type ShopListResponse = {
  allShops: ShopListItem[];
  premiumShops: ShopListItem[];
  regularShops: ShopListItem[];
  regularTotal?: number;
  total: number;
};

type ViewMode = "card" | "list";

const themeEmoji: Record<string, string> = {
  swedish: "🌿",
  aroma: "🌸",
  thai: "🙏",
  sport: "💪",
  deep: "🔥",
  hot_stone: "💎",
  foot: "🦶",
  couple: "👫",
  geonma: "💆",
};

const REGULAR_PAGE_SIZE = 30;

function withShopMediaVariant(source: string, variant: 'premium-card' | 'hero') {
  const normalizedSource = source.trim();
  if (!normalizedSource || normalizedSource.startsWith('data:')) {
    return normalizedSource;
  }

  if (/([?&])size=[^&]*/.test(normalizedSource)) {
    return normalizedSource.replace(/([?&])size=[^&]*/, `$1size=${variant}`);
  }

  return `${normalizedSource}${normalizedSource.includes('?') ? '&' : '?'}size=${variant}`;
}


export default function HomePageClient({
  initialPremiumShops,
  initialRegularShops,
  initialRegularTotal,
  initialSiteSettings,
  deferInitialDirectoryFetch = false,
  children,
}: {
  initialPremiumShops: ShopListItem[];
  initialRegularShops: ShopListItem[];
  initialRegularTotal: number;
  initialSiteSettings: SiteSettings;
  deferInitialDirectoryFetch?: boolean;
  children?: ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedRegion = searchParams.get("region") ?? "all";
  const selectedSubRegion = searchParams.get("subRegion") ?? "all";
  const selectedTheme = searchParams.get("theme") ?? "all";
  const themes = useThemes();
  const searchQuery = searchParams.get("q") ?? "";
  const sortType = getDirectorySortType(searchParams.get("sort"));
  const directoryMode = getDirectoryMode(searchParams.get("view"));
  const viewParam = searchParams.get("viewMode") === "list" ? "list" : "card";
  const initialPage = normalizePageParam(searchParams.get("page"));

  const [premiumShops, setPremiumShops] =
    useState<ShopListItem[]>(initialPremiumShops);
  const [regularShops, setRegularShops] =
    useState<ShopListItem[]>(initialRegularShops);
  const [regularTotal, setRegularTotal] = useState(initialRegularTotal);
  const [isLoading, setIsLoading] = useState(deferInitialDirectoryFetch);
  const [hasLoadedDirectory, setHasLoadedDirectory] = useState(!deferInitialDirectoryFetch);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(viewParam);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const shopResponseCache = useRef(new Map<string, ShopListResponse>());
  const prefetchedDetailHrefs = useRef(new Set<string>());
  const warmedDetailImages = useRef(new Set<string>());
  const bootstrappedFromUrl = useRef(false);


  const warmPremiumDetailAssets = useCallback(
    (detailHref: string, imageUrl?: string | null) => {
      if (!prefetchedDetailHrefs.current.has(detailHref)) {
        prefetchedDetailHrefs.current.add(detailHref);
        router.prefetch(detailHref);
      }

      const normalizedImageUrl = imageUrl?.trim();
      if (!normalizedImageUrl || warmedDetailImages.current.has(normalizedImageUrl) || typeof window === "undefined") {
        return;
      }

      warmedDetailImages.current.add(normalizedImageUrl);
      const detailImage = new window.Image();
      detailImage.decoding = "async";
      detailImage.fetchPriority = "high";
      detailImage.src = normalizedImageUrl;
    },
    [router],
  );

  useEffect(() => {
    if (premiumShops.length === 0) {
      return;
    }

    const connection = (navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
      };
    }).connection;

    if (connection?.saveData || connection?.effectiveType?.includes('2g')) {
      return;
    }

    const leadPremiumShops = premiumShops.slice(0, 1).map((shop) => ({
      detailHref: buildShopDetailHref(shop.slug, {
        mode: directoryMode,
        region: selectedRegion !== "all" ? selectedRegion : undefined,
        subRegion: selectedSubRegion !== "all" ? selectedSubRegion : undefined,
        theme: selectedTheme !== "all" ? selectedTheme : undefined,
      }),
    }));

    const prefetchLeadPremiumRoutes = () => {
      leadPremiumShops.forEach(({ detailHref }) => {
        if (!prefetchedDetailHrefs.current.has(detailHref)) {
          prefetchedDetailHrefs.current.add(detailHref);
          router.prefetch(detailHref);
        }
      });
    };

    if (typeof window.requestIdleCallback === 'function') {
      const idleHandle = window.requestIdleCallback(prefetchLeadPremiumRoutes, { timeout: 3000 });
      return () => {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleHandle);
        }
      };
    }

    const timeoutHandle = window.setTimeout(prefetchLeadPremiumRoutes, 2500);
    return () => {
      window.clearTimeout(timeoutHandle);
    };
  }, [directoryMode, premiumShops, router, selectedRegion, selectedSubRegion, selectedTheme]);


  const loadShops = useCallback(
    async (
      page: number = 1,
      params: URLSearchParams = new URLSearchParams(searchParams.toString()),
    ) => {
      setIsLoading(true);
      setError(null);
      setHasLoadedDirectory(false);

      const nextRegion = params.get("region") ?? "all";
      const nextSubRegion = params.get("subRegion") ?? "all";
      const nextTheme = params.get("theme") ?? "all";
      const nextQuery = params.get("q") ?? "";
      const nextSort = getDirectorySortType(params.get("sort"));
      const apiParams = buildDirectorySearchParams({
        region: nextRegion,
        subRegion: nextSubRegion,
        theme: nextTheme,
        q: nextQuery,
        sort: nextSort,
        extraParams: {
          regularOffset: (page - 1) * REGULAR_PAGE_SIZE,
          regularLimit: REGULAR_PAGE_SIZE,
        },
      });
      const cacheKey = apiParams.toString();

      const cached = shopResponseCache.current.get(cacheKey);
      if (cached) {
        setPremiumShops((cached.premiumShops ?? []).slice(0, 4));
        setRegularShops(cached.regularShops ?? []);
        setRegularTotal(
          cached.regularTotal ?? cached.regularShops?.length ?? 0,
        );
        setCurrentPage(page);
        setIsLoading(false);
        setHasLoadedDirectory(true);
        return;
      }

      try {
        const response = await fetch(`/api/shops?${cacheKey}`);
        const result = (await response.json()) as Partial<ShopListResponse> & {
          error?: string;
        };

        if (!response.ok) {
          setError(result.error ?? "업소 목록을 불러오지 못했습니다.");
          return;
        }

        const nextResponse: ShopListResponse = {
          allShops: result.allShops ?? [],
          premiumShops: result.premiumShops ?? [],
          regularShops: result.regularShops ?? [],
          regularTotal: result.regularTotal ?? result.regularShops?.length ?? 0,
          total:
            result.total ??
            result.regularTotal ??
            result.regularShops?.length ??
            0,
        };
        shopResponseCache.current.set(cacheKey, nextResponse);
        setPremiumShops(nextResponse.premiumShops.slice(0, 4));
        setRegularShops(nextResponse.regularShops);
        setRegularTotal(
          nextResponse.regularTotal ?? nextResponse.regularShops.length,
        );
        setCurrentPage(page);
        setHasLoadedDirectory(true);
      } catch {
        setError("업소 목록을 불러오지 못했습니다.");
        setHasLoadedDirectory(true);
      } finally {
        setIsLoading(false);
      }
    },
    [searchParams],
  );

  const handlePageChange = (page: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(page));
    }
    router.replace(
      `${pathname}${nextParams.toString() ? `?${nextParams.toString()}` : ""}`,
      { scroll: true },
    );
    void loadShops(page);
  };
  const handleDirectoryNavigate = useCallback<
    MouseEventHandler<HTMLAnchorElement>
  >(
    (event) => {
      const targetUrl = new URL(event.currentTarget.href);

      if (
        targetUrl.origin !== window.location.origin ||
        targetUrl.pathname !== pathname ||
        pathname !== "/"
      ) {
        return;
      }

      event.preventDefault();
      window.history.pushState(
        null,
        "",
        `${targetUrl.pathname}${targetUrl.search}`,
      );
      const nextParams = new URLSearchParams(targetUrl.search);
      const nextPage = normalizePageParam(nextParams.get("page"));
      window.scrollTo({ top: 0, behavior: "auto" });
      void loadShops(nextPage, nextParams);
    },
    [loadShops, pathname],
  );
  useEffect(() => {
    const handleGlobalDirectoryNavigate = (event: Event) => {
      const href = (event as CustomEvent<{ href?: string }>).detail?.href;
      if (!href) {
        return;
      }

      const targetUrl = new URL(href, window.location.origin);
      window.history.pushState(
        null,
        "",
        `${targetUrl.pathname}${targetUrl.search}`,
      );
      const nextParams = new URLSearchParams(targetUrl.search);
      const nextPage = normalizePageParam(nextParams.get("page"));
      window.scrollTo({ top: 0, behavior: "auto" });
      void loadShops(nextPage, nextParams);
    };

    window.addEventListener(
      "public-directory:navigate",
      handleGlobalDirectoryNavigate,
    );
    return () =>
      window.removeEventListener(
        "public-directory:navigate",
        handleGlobalDirectoryNavigate,
      );
  }, [loadShops]);

  useEffect(() => {
    setViewMode(viewParam);
  }, [viewParam]);

  useEffect(() => {
    setPremiumShops(initialPremiumShops);
    setRegularShops(initialRegularShops);
    setRegularTotal(initialRegularTotal);
    setCurrentPage(initialPage);
    setError(null);
    setIsLoading(deferInitialDirectoryFetch);
    setHasLoadedDirectory(!deferInitialDirectoryFetch);
  }, [
    deferInitialDirectoryFetch,
    initialPremiumShops,
    initialRegularShops,
    initialRegularTotal,
    initialPage,
  ]);

  useEffect(() => {
    if (
      !shouldAutoLoadDeferredHomeDirectory({
        deferInitialDirectoryFetch,
        premiumCount: initialPremiumShops.length,
        regularCount: initialRegularShops.length,
      })
    ) {
      return;
    }

    void loadShops(initialPage, new URLSearchParams(window.location.search));
  }, [
    deferInitialDirectoryFetch,
    initialPremiumShops.length,
    initialRegularShops.length,
    loadShops,
    initialPage,
  ]);
  useEffect(() => {
    if (bootstrappedFromUrl.current || pathname !== "/") {
      return;
    }

    const shouldHydrateFromUrl =
      initialPage > 1 ||
      selectedRegion !== "all" ||
      selectedSubRegion !== "all" ||
      selectedTheme !== "all" ||
      Boolean(searchQuery) ||
      Boolean(searchParams.get("sort")) ||
      searchParams.get("view") === "theme";

    if (!shouldHydrateFromUrl) {
      return;
    }

    bootstrappedFromUrl.current = true;
    void loadShops(initialPage, new URLSearchParams(window.location.search));
  }, [
    initialPage,
    loadShops,
    pathname,
    searchParams,
    searchQuery,
    selectedRegion,
    selectedSubRegion,
    selectedTheme,
  ]);
  useEffect(() => {
    if (
      isLoading ||
      (deferInitialDirectoryFetch &&
        premiumShops.length === 0 &&
        regularShops.length === 0 &&
        regularTotal === 0)
    ) {
      return;
    }

    const params = buildDirectorySearchParams({
      region: selectedRegion,
      subRegion: selectedSubRegion,
      theme: selectedTheme,
      q: searchQuery,
      sort: sortType,
      extraParams: {
        regularOffset: (currentPage - 1) * REGULAR_PAGE_SIZE,
        regularLimit: REGULAR_PAGE_SIZE,
      },
    });
    shopResponseCache.current.set(params.toString(), {
      allShops: [...premiumShops, ...regularShops],
      premiumShops,
      regularShops,
      regularTotal,
      total: premiumShops.length + regularTotal,
    });
  }, [
    currentPage,
    premiumShops,
    regularShops,
    regularTotal,
    searchQuery,
    selectedRegion,
    selectedSubRegion,
    selectedTheme,
    sortType,
    deferInitialDirectoryFetch,
    isLoading,
    hasLoadedDirectory,
  ]);
  useEffect(() => {
    if (pathname !== "/" || searchQuery || isLoading || !hasLoadedDirectory) {
      return;
    }

    if (selectedRegion === "all" && selectedSubRegion === "all" && selectedTheme === "all") {
      return;
    }

    const connection = (navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
      };
    }).connection;
    if (connection?.saveData || connection?.effectiveType?.includes("2g")) {
      return;
    }

    const runPrewarm = () => {
      const apiParams = buildDirectorySearchParams({
        region: selectedRegion,
        subRegion: selectedSubRegion,
        theme: selectedTheme,
        extraParams: {
          regularOffset: 0,
          regularLimit: REGULAR_PAGE_SIZE,
        },
      });
      const cacheKey = apiParams.toString();

      if (shopResponseCache.current.has(cacheKey)) {
        return;
      }

      void fetch(`/api/shops?${cacheKey}`)
        .then(async (response) => {
          if (!response.ok) {
            return;
          }

          const result = (await response.json()) as Partial<ShopListResponse>;
          shopResponseCache.current.set(cacheKey, {
            allShops: result.allShops ?? [],
            premiumShops: result.premiumShops ?? [],
            regularShops: result.regularShops ?? [],
            regularTotal: result.regularTotal ?? result.regularShops?.length ?? 0,
            total: result.total ?? result.regularTotal ?? result.regularShops?.length ?? 0,
          });
        })
        .catch(() => {
          // Visible navigation still loads on demand.
        });
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleHandle = window.requestIdleCallback(runPrewarm, { timeout: 4000 });
      return () => {
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(idleHandle);
        }
      };
    }

    const timeoutId = window.setTimeout(runPrewarm, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [
    hasLoadedDirectory,
    isLoading,
    pathname,
    searchQuery,
    selectedRegion,
    selectedSubRegion,
    selectedTheme,
  ]);

  const regionLabel = useMemo(
    () =>
      REGIONS.find((region) => region.code === selectedRegion)?.label ?? "전체",
    [selectedRegion],
  );
  const isAllCategorySelected =
    selectedRegion === "all" && selectedTheme === "all";
  const subRegionLabel = useMemo(() => {
    if (selectedRegion === "all" || selectedSubRegion === "all") {
      return "";
    }
    return (
      DISTRICTS[selectedRegion]?.find(
        (district) => district.code === selectedSubRegion,
      )?.label ?? ""
    );
  }, [selectedRegion, selectedSubRegion]);
  const themeLabel = useMemo(
    () => themes.find((theme) => theme.code === selectedTheme)?.label,
    [selectedTheme, themes],
  );

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-3">
      <div className="flex gap-3">
        <Sidebar onDirectoryNavigate={handleDirectoryNavigate} />

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-[var(--portal-brand-dark)] via-[var(--portal-brand-hover)] to-[var(--portal-brand)] p-4 text-white shadow-md">
            <div>
              <p className="text-base font-black">
                {initialSiteSettings.heroMainText}
              </p>
              <p className="mt-0.5 text-sm text-white/80">
                {initialSiteSettings.heroSubText}
              </p>
            </div>
            <button
              onClick={() => void loadShops(currentPage)}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-bold transition-all hover:bg-white/30 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              새로고침
            </button>
          </div>

          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide md:hidden">
            <Link
              href="/"
              prefetch={false}
              onClick={handleDirectoryNavigate}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                isAllCategorySelected
                  ? "border-[var(--portal-brand)] bg-[var(--portal-brand)] text-white"
                  : "border-gray-300 bg-white text-gray-600"
              }`}
            >
              전체
            </Link>
            {["seoul", "gyeonggi", "incheon", "busan", "daegu", "jeju"]
              .map((code) => REGIONS.find((region) => region.code === code))
              .filter((region): region is NonNullable<typeof region> =>
                Boolean(region),
              )
              .map((region) => (
                <Link
                  key={region.code}
                  href={buildBrowseHref({
                    mode: "region",
                    region: region.code,
                  })}
                  prefetch={false}
                  onClick={handleDirectoryNavigate}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    selectedRegion === region.code
                      ? "border-[var(--portal-brand)] bg-[var(--portal-brand)] text-white"
                      : "border-gray-300 bg-white text-gray-600"
                  }`}
                >
                  {region.label}
                </Link>
              ))}
          </div>

          {premiumShops.length > 0 && (
            <div className="premium-box mb-4 p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[var(--portal-brand)] text-base">👑</span>
                <span className="text-sm font-black text-[var(--portal-brand-dark)]">
                  PREMIUM 추천업소
                </span>
                <div className="h-px flex-1 bg-[color-mix(in_srgb,var(--portal-brand)_25%,white)]" />
                <span className="rounded border border-[color-mix(in_srgb,var(--portal-brand)_18%,white)] bg-[var(--portal-brand-soft)] px-1.5 py-0.5 text-[10px] text-[var(--portal-brand)]">
                  광고 · 최대 4개
                </span>
              </div>

              <div className="premium-shop-grid">
                {premiumShops.map((shop, index) => {
                  const detailHref = buildShopDetailHref(shop.slug, {
                    mode: directoryMode,
                    region:
                      selectedRegion !== "all" ? selectedRegion : undefined,
                    subRegion:
                      selectedSubRegion !== "all"
                        ? selectedSubRegion
                        : undefined,
                    theme:
                      selectedTheme !== "all" ? selectedTheme : undefined,
                  });

                  const premiumThumbnailUrl = withShopMediaVariant(shop.thumbnailUrl, 'premium-card');
                  const detailHeroUrl = withShopMediaVariant(shop.detailImageUrl || shop.bannerUrl || shop.thumbnailUrl, 'hero');

                  return (
                    <Link
                      key={shop.id}
                      href={detailHref}
                      scroll
                      prefetch={false}
                      onMouseEnter={() => warmPremiumDetailAssets(detailHref, detailHeroUrl)}
                      onFocus={() => warmPremiumDetailAssets(detailHref, detailHeroUrl)}
                      onTouchStart={() => warmPremiumDetailAssets(detailHref, detailHeroUrl)}
                      onPointerDown={() => warmPremiumDetailAssets(detailHref, detailHeroUrl)}
                      className="premium-shop-card flex overflow-hidden rounded-2xl border-2 border-[var(--portal-blue-banner-border)] bg-white transition-all hover:-translate-y-1 hover:shadow-xl hover:border-[var(--portal-brand-hover)]"
                    >
                      <div className="premium-shop-media relative flex aspect-square shrink-0 items-center justify-center border-[color-mix(in_srgb,var(--portal-brand)_16%,white)] bg-gradient-to-br from-[var(--portal-brand-soft)] to-white">
                        {premiumThumbnailUrl ? (
                          <img
                            src={premiumThumbnailUrl}
                            alt={shop.name}
                            width={480}
                            height={480}
                            className="absolute inset-0 h-full w-full bg-white object-contain"
                            loading={index === 0 ? "eager" : "lazy"}
                            decoding="async"
                            fetchPriority={index === 0 ? "high" : "low"}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <span className="text-6xl opacity-50 sm:text-7xl">
                            {themeEmoji[shop.theme] ?? "✨"}
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
                        <div className="mb-2 flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-1.5">
                              <span className="rounded bg-[var(--portal-brand)] px-1.5 py-0.5 text-[10px] font-black text-white sm:text-xs">
                                AD
                              </span>
                              <h3 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                                {shop.name}
                              </h3>
                            </div>
                            <p className="line-clamp-1 text-xs text-gray-500 sm:text-sm">
                              {shop.tagline}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[color-mix(in_srgb,var(--portal-brand)_18%,white)] bg-[var(--portal-brand-soft)] px-2 py-1">
                            <Star className="h-4 w-4 fill-[var(--portal-rank)] text-[var(--portal-rank)]" />
                            <span className="text-sm font-bold text-[var(--portal-brand-dark)]">
                              {formatRating(shop.rating)}
                            </span>
                          </div>
                        </div>
                        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3.5 w-3.5 text-[var(--portal-brand)]" />
                            {shop.regionLabel}
                          </span>
                          <span className="font-medium text-[var(--portal-brand)]">
                            #{shop.themeLabel}
                          </span>
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-2">
                          <div className="flex flex-wrap gap-1.5">
                            {shop.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 sm:text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          {shop.courses[0] ? (
                            <span className="text-sm font-black text-[var(--portal-brand)] sm:text-base">
                              {shop.courses[0].price}~
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-gray-800">
                  {searchQuery
                    ? `🔍 '${searchQuery}' 검색 결과`
                    : `📋 ${sortType === "popular" ? "인기 추천 업소" : "전체 업소"}`}
                  {regionLabel !== "전체" &&
                    !searchQuery &&
                    ` · ${regionLabel} ${subRegionLabel}`}
                  {themeLabel && !searchQuery && ` · ${themeLabel}`}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                  ({(currentPage - 1) * REGULAR_PAGE_SIZE + 1}-
                  {Math.min(currentPage * REGULAR_PAGE_SIZE, regularTotal)} /{" "}
                  {regularTotal}개)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {sortType === "popular" && (
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
                    onClick={() => setViewMode("card")}
                    className={`rounded-md p-1.5 transition-colors ${
                      viewMode === "card"
                        ? "bg-white text-[var(--portal-brand)] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    aria-label="카드형 보기"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-md p-1.5 transition-colors ${
                      viewMode === "list"
                        ? "bg-white text-[var(--portal-brand)] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    aria-label="리스트형 보기"
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() =>
                    setRegularShops((current) =>
                      sortRegularShops(current, sortType),
                    )
                  }
                  disabled={isLoading}
                  className="flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-brand)] disabled:opacity-50"
                >
                  <Shuffle
                    className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
                  />
                  랜덤
                </button>
              </div>
            </div>

            {error ? (
              <div className="py-16 text-center text-sm text-red-500">
                {error}
              </div>
            ) : regularShops.length === 0 && (!hasLoadedDirectory || isLoading) ? (
              <div className="py-16 text-center text-sm text-gray-400">
                업소 목록을 불러오는 중입니다...
              </div>
            ) : regularShops.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                해당 조건의 업소가 없습니다.
              </div>
            ) : (
              <>
                <div
                  className={`shop-grid transition-opacity duration-200 ${
                    isLoading ? "opacity-30" : "opacity-100"
                  } ${viewMode === "list" ? "list-view" : "card-view"}`}
                >
                  {regularShops.map((shop, index) => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      prefetchStrategy={index < 2 ? "lead" : "intent"}
                      detailHref={buildShopDetailHref(shop.slug, {
                        mode: directoryMode,
                        region:
                          selectedRegion === shop.region
                            ? selectedRegion
                            : undefined,
                        subRegion:
                          shop.subRegion && selectedSubRegion === shop.subRegion
                            ? selectedSubRegion
                            : undefined,
                        theme:
                          selectedTheme === shop.theme
                            ? selectedTheme
                            : undefined,
                      })}
                    />
                  ))}
                </div>

                <div className="mt-8">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(regularTotal / REGULAR_PAGE_SIZE)}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            )}
          </div>

          <MobileBannerRail />

          {children}
        </div>

        <HomeUtilityRail mode="sidebar" directoryMode={directoryMode} />
      </div>
    </div>
  );
}
