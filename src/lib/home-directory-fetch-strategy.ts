
import type { DirectoryMode } from '@/lib/directory-mode';
import { type ShopListResponse } from '@/lib/public-page-data';
import { deriveStructuredSearchIntent } from '@/lib/structured-search';

export function shouldDeferInitialHomeDirectoryFetch({
  mode,
  region,
  subRegion,
  theme,
  query,
}: {
  mode: DirectoryMode;
  region?: string | null;
  subRegion?: string | null;
  theme?: string | null;
  query?: string | null;
}) {
  const freeTextQuery = deriveStructuredSearchIntent(query).freeText;

  if (freeTextQuery) {
    return true;
  }

  return mode === 'theme' && !region && !subRegion && !theme;
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
  return deferInitialDirectoryFetch && premiumCount === 0 && regularCount == 0;
}
