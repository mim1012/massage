'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, MapPin } from 'lucide-react';
import type { ShopListItem } from '@/lib/types';
import { formatRating } from '@/lib/utils';
import clsx from 'clsx';

interface ShopCardProps {
  shop: ShopListItem;
  variant?: 'premium' | 'regular';
  detailHref?: string;
  prefetchStrategy?: 'intent' | 'lead';
}


const themeEmoji: Record<string, string> = {
  swedish: '',
  aroma: '🌸',
  thai: '🙏',
  sport: '💪',
  deep: '',
  hot_stone: '💎',
  foot: '🦶',
  couple: '👫',
  geonma: '💆',
};

const gradients = [
  'from-[var(--portal-brand-soft)] to-white',
  'from-[color-mix(in_srgb,var(--portal-brand)_12%,white)] to-white',
  'from-[color-mix(in_srgb,var(--portal-theme)_12%,white)] to-[var(--portal-brand-soft)]',
  'from-white to-[var(--portal-brand-soft)]',
  'from-[color-mix(in_srgb,var(--portal-rank)_10%,white)] to-white',
  'from-[var(--portal-brand-soft)] to-[color-mix(in_srgb,var(--portal-theme)_8%,white)]',
  'from-slate-50 to-[var(--portal-brand-soft)]',
  'from-white to-[color-mix(in_srgb,var(--portal-brand)_10%,white)]',
];

function withShopMediaVariant(source: string | undefined, variant: 'card' | 'hero') {
  const normalizedSource = source?.trim() ?? '';
  if (!normalizedSource || normalizedSource.startsWith('data:')) {
    return normalizedSource;
  }

  if (/([?&])size=[^&]*/.test(normalizedSource)) {
    return normalizedSource.replace(/([?&])size=[^&]*/, `$1size=${variant}`);
  }

  return `${normalizedSource}${normalizedSource.includes('?') ? '&' : '?'}size=${variant}`;
}

function ShopCard({
  shop,
  variant = 'regular',
  detailHref = `/shop/${shop.slug}`,
  prefetchStrategy = 'intent',
}: ShopCardProps) {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const prefetchedRef = useRef(false);
  const warmedImageRef = useRef(false);



  useEffect(() => {
    prefetchedRef.current = false;
    warmedImageRef.current = false;
  }, [detailHref]);

  const prefetchDetail = useCallback(() => {
    if (prefetchedRef.current) {
      return;
    }

    prefetchedRef.current = true;
    router.prefetch(detailHref);
  }, [detailHref, router]);

  const rawThumbnailUrl = shop.thumbnailUrl?.trim();
  const thumbnailUrl = withShopMediaVariant(rawThumbnailUrl, 'card');
  const detailImageUrl = withShopMediaVariant(shop.detailImageUrl || shop.bannerUrl || rawThumbnailUrl, 'hero');
  const warmDetailAssets = useCallback(() => {
    prefetchDetail();

    if (!detailImageUrl || warmedImageRef.current || typeof window === 'undefined') {
      return;
    }

    warmedImageRef.current = true;
    const detailImage = new window.Image();
    detailImage.decoding = 'async';
    detailImage.fetchPriority = 'high';
    detailImage.src = detailImageUrl;
  }, [detailImageUrl, prefetchDetail]);

  useEffect(() => {
    if (prefetchStrategy !== 'lead') {
      return;
    }

    const currentLink = linkRef.current;
    if (!currentLink) {
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

    if (typeof window.IntersectionObserver === 'function') {
      const observer = new window.IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            prefetchDetail();
            observer.disconnect();
          }
        },
        { rootMargin: '120px' },
      );

      observer.observe(currentLink);
      return () => observer.disconnect();
    }

    if (typeof window.requestIdleCallback === 'function') {
      const idleHandle = window.requestIdleCallback(() => {
        prefetchDetail();
      }, { timeout: 1500 });

      return () => {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleHandle);
        }
      };
    }

    const timeoutHandle = window.setTimeout(() => {
      prefetchDetail();
    }, 900);

    return () => window.clearTimeout(timeoutHandle);
  }, [prefetchStrategy, prefetchDetail]);




  const isPremium = variant === 'premium' || shop.isPremium;
  const gIdx = Math.abs(parseInt(shop.id.replace(/\D/g, ''), 10) || 0) % gradients.length;
  const [imageFailed, setImageFailed] = useState(false);
  const showThumbnail = Boolean(thumbnailUrl) && !imageFailed;

  return (
    <Link
      ref={linkRef}
      href={detailHref}
      scroll
      prefetch={false}
      onMouseEnter={warmDetailAssets}
      onFocus={warmDetailAssets}
      onTouchStart={warmDetailAssets}
      onPointerDown={warmDetailAssets}
      className={clsx(
        'shop-card group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[color-mix(in_srgb,var(--portal-brand)_35%,white)]',
        isPremium ? 'border-[var(--portal-blue-banner-border)]' : 'border-gray-200 border-opacity-70',
      )}
    >
      <div
        className={clsx(
          'shop-card-img relative flex shrink-0 items-center justify-center bg-gradient-to-br',
          gradients[gIdx],
        )}
      >
        {showThumbnail ? (
          <img
            src={thumbnailUrl}
            alt={shop.name}
            width={320}
            height={320}
            className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300 group-hover:opacity-95"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-5xl opacity-50 transition-transform duration-300 group-hover:scale-110">
            {themeEmoji[shop.theme] ?? '✨'}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="mb-1 flex items-start justify-between gap-1">
          <h3 className="line-clamp-1 text-sm font-bold text-gray-900">{shop.name}</h3>
          {isPremium ? (
            <span className="shrink-0 rounded bg-[var(--portal-brand)] px-1 py-0.5 text-[9px] font-black text-white">AD</span>
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
            <Star className="h-3 w-3 fill-[var(--portal-rank)] text-[var(--portal-rank)]" />
            <span className="font-bold text-gray-700">{formatRating(shop.rating)}</span>
          </div>
          {shop.courses[0] ? <span className="text-xs font-bold text-[var(--portal-brand)]">{shop.courses[0].price}~</span> : null}
        </div>
      </div>
    </Link>
  );
}

export default memo(ShopCard);
