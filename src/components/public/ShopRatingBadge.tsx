'use client';

import { Star } from 'lucide-react';
import { formatRating } from '@/lib/utils';
import { useShopReviewStats } from '@/components/public/shop-review-stats';

type ShopRatingBadgeProps = {
  slug: string;
  rating: number;
  reviewCount: number;
};

export default function ShopRatingBadge({ slug, rating, reviewCount }: ShopRatingBadgeProps) {
  const stats = useShopReviewStats(slug, { rating, reviewCount });

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-4 w-4 ${
            value <= Math.round(stats.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-bold text-gray-700">{formatRating(stats.rating)}</span>
      <span className="text-xs text-gray-500">({stats.reviewCount}개 후기)</span>
    </div>
  );
}
