'use client';

import { useEffect, useState } from 'react';

export type ShopReviewStats = { rating: number; reviewCount: number };

const SHOP_REVIEW_STATS_EVENT = 'shop-review-stats';

type ShopReviewStatsDetail = { slug: string; stats: ShopReviewStats };

export function publishShopReviewStats(slug: string, stats: ShopReviewStats) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ShopReviewStatsDetail>(SHOP_REVIEW_STATS_EVENT, { detail: { slug, stats } }),
  );
}

export function useShopReviewStats(slug: string, initial: ShopReviewStats): ShopReviewStats {
  const [stats, setStats] = useState<ShopReviewStats>(initial);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ShopReviewStatsDetail>).detail;
      if (detail && detail.slug === slug) {
        setStats(detail.stats);
      }
    };

    window.addEventListener(SHOP_REVIEW_STATS_EVENT, handler);
    return () => window.removeEventListener(SHOP_REVIEW_STATS_EVENT, handler);
  }, [slug]);

  return stats;
}
