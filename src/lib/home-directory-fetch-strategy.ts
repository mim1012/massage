import { type ShopListResponse } from '@/lib/public-page-data';

export function shouldDeferInitialHomeDirectoryFetch(_input?: unknown) {
  void _input;
  return true;
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
