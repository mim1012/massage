
import { type ShopListResponse } from '@/lib/public-page-data';
import { deriveStructuredSearchIntent } from '@/lib/structured-search';

export function shouldDeferInitialHomeDirectoryFetch({
  query,
}: {
  query?: string | null;
}) {
  return Boolean(deriveStructuredSearchIntent(query).freeText);
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
