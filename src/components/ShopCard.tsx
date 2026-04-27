'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Star, MapPin } from 'lucide-react';
import { buildShopDetailHref } from '@/lib/browse-context';
import { Shop } from '@/lib/types';
import { formatRating } from '@/lib/utils';
import clsx from 'clsx';

interface ShopCardProps {
  shop: Shop;
  variant?: 'premium' | 'regular';
}

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

const gradients = [
  'from-orange-100 to-amber-50',
  'from-rose-100 to-pink-50',
  'from-[#FEFAE0] to-white',
  'from-yellow-100 to-amber-50',
  'from-amber-100 to-orange-50',
  'from-[#FEFAE0] to-[#FCF9F5]',
  'from-peach-100 to-pink-50',
  'from-lime-100 to-green-50',
];

export default function ShopCard({ shop, variant = 'regular' }: ShopCardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPremium = variant === 'premium' || shop.isPremium;
  const gIdx = Math.abs(parseInt(shop.id.replace(/\D/g, ''), 10) || 0) % gradients.length;
  const detailHref = buildShopDetailHref(shop.slug, {
    source: pathname.startsWith('/top100') ? 'top100' : 'home',
    mode: searchParams.get('view') === 'theme' && searchParams.get('theme') === shop.theme ? 'theme' : 'region',
    region: searchParams.get('region') === shop.region ? searchParams.get('region') ?? undefined : undefined,
    subRegion:
      shop.subRegion && searchParams.get('subRegion') === shop.subRegion ? searchParams.get('subRegion') ?? undefined : undefined,
    theme: searchParams.get('theme') === shop.theme ? searchParams.get('theme') ?? undefined : undefined,
  });

  return (
    <Link
      href={detailHref}
      className={clsx(
        'shop-card group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg',
        isPremium ? 'border-[var(--portal-premium-border)]' : 'border-gray-200 border-opacity-70',
      )}
    >
      <div className={clsx('shop-card-img relative flex shrink-0 items-center justify-center bg-gradient-to-br', gradients[gIdx])}>
        <span className="text-5xl opacity-50 transition-transform duration-300 group-hover:scale-110">
          {themeEmoji[shop.theme] ?? '✨'}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="mb-1 flex items-start justify-between gap-1">
          <h3 className="line-clamp-1 text-sm font-bold text-gray-900">{shop.name}</h3>
          {isPremium ? (
            <span className="shrink-0 rounded bg-[var(--portal-premium-border)] px-1 py-0.5 text-[9px] font-black text-white">AD</span>
          ) : null}
        </div>

        <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3 flex-shrink-0 text-[var(--portal-brand)]" />
          <span className="truncate">
            {shop.regionLabel} {shop.subRegionLabel}
          </span>
        </div>

        <div className="mb-2 flex h-[20px] flex-wrap gap-1 overflow-hidden line-clamp-1">
          <span className="shrink-0 rounded border border-[color-mix(in_srgb,var(--portal-brand)_20%,transparent)] bg-[var(--portal-brand-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--portal-brand)]">
            #{shop.themeLabel}
          </span>
          {shop.tags.slice(0, 2).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="shrink-0 rounded border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2">
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-gray-700">{formatRating(shop.rating)}</span>
          </div>
          {shop.courses[0] ? <span className="text-xs font-bold text-[var(--portal-brand)]">{shop.courses[0].price}~</span> : null}
        </div>
      </div>
    </Link>
  );
}
