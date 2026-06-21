import { REGIONS, DISTRICTS } from '@/lib/catalog';
import type { DirectoryMode } from '@/lib/directory-mode';
import { type ShopListResponse } from '@/lib/public-page-data';

type HomeDirectoryFetchStrategyInput = {
  mode?: DirectoryMode;
  region?: string;
  subRegion?: string;
  theme?: string;
  query?: string;
};

const STRUCTURED_LOCATION_TERMS = new Set(
  [
    ...REGIONS.flatMap((region) => [region.code, region.label]),
    ...Object.values(DISTRICTS).flatMap((districts) =>
      districts.flatMap((district) => [district.code, district.label]),
    ),
  ].map((value) => value.trim().toLowerCase()),
);

function normalizeFilterValue(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === 'all') {
    return undefined;
  }

  return trimmed;
}

function isStructuredLocationQuery(query: string) {
  return STRUCTURED_LOCATION_TERMS.has(query.trim().toLowerCase());
}

export function shouldDeferInitialHomeDirectoryFetch(input: HomeDirectoryFetchStrategyInput = {}) {
  const mode = input.mode ?? 'region';
  const region = normalizeFilterValue(input.region);
  const subRegion = normalizeFilterValue(input.subRegion);
  const theme = normalizeFilterValue(input.theme);
  const query = input.query?.trim();

  if (query) {
    return !isStructuredLocationQuery(query);
  }

  if (mode === 'theme') {
    return !region && !subRegion && !theme;
  }

  return false;
}

export function createDeferredHomeShopResponse(): ShopListResponse {
  return {
    allShops: [],
    premiumShops: [],
    regularShops: [],
    regularTotal: 0,
    total: 0,
  };
}

export function shouldAutoLoadDeferredHomeDirectory({
  deferInitialDirectoryFetch,
  premiumCount,
  regularCount,
}: {
  deferInitialDirectoryFetch: boolean;
  premiumCount: number;
  regularCount: number;
}) {
  return deferInitialDirectoryFetch && premiumCount === 0 && regularCount === 0;
}