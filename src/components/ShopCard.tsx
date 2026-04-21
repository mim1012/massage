'use client';

import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { Shop } from '@/lib/types';
import { formatRating } from '@/lib/utils';
import clsx from 'clsx';

interface ShopCardProps {
  shop: Shop;
  variant?: 'premium' | 'regular';
}

const themeEmoji: Record<string, string> = {
  swedish: '🌿', aroma: '🌸', thai: '🙏', sport: '💪',
  deep: '🔥', hot_stone: '💎', foot: '🦶', couple: '👫',
};

const gradients = [
  'from-rose-100 to-pink-50', 'from-purple-100 to-violet-50', 'from-blue-100 to-sky-50', 'from-emerald-100 to-teal-50',
  'from-amber-100 to-yellow-50', 'from-cyan-100 to-blue-50', 'from-fuchsia-100 to-pink-50', 'from-lime-100 to-green-50',
];

export default function ShopCard({ shop, variant = 'regular' }: ShopCardProps) {
  const isPremium = variant === 'premium' || shop.isPremium;
  const gIdx = parseInt(shop.id.replace(/\D/g, ''), 10) % gradients.length;

  return (
    <Link
      href={`/shop/${shop.slug}`}
      className={clsx(
        'shop-card group flex flex-col bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-transform duration-300 hover:-translate-y-1',
        isPremium ? 'border-amber-400' : 'border-gray-200 border-opacity-70'
      )}
    >
      <div className={clsx('relative shop-card-img shrink-0 flex items-center justify-center bg-gradient-to-br', gradients[gIdx])}>
        <span className="text-5xl opacity-50 group-hover:scale-110 transition-transform duration-300">
          {themeEmoji[shop.theme] ?? '✨'}
        </span>
      </div>
      <div className="p-3 flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start gap-1 mb-1">
          <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{shop.name}</h3>
          {isPremium && <span className="bg-amber-500 text-white text-[9px] font-black px-1 py-0.5 rounded shrink-0">AD</span>}
        </div>
        
        <div className="flex items-center gap-1 mb-2 text-xs text-gray-500">
          <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
          <span className="truncate">{shop.regionLabel} {shop.subRegionLabel}</span>
        </div>

        <div className="flex gap-1 flex-wrap mb-2 line-clamp-1 h-[20px] overflow-hidden">
          <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded font-medium border border-red-100 shrink-0">#{shop.themeLabel}</span>
          {shop.tags.slice(0, 2).map((tag, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded shrink-0 border border-gray-100">{tag}</span>
          ))}
        </div>

        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-gray-700">{formatRating(shop.rating)}</span>
          </div>
          {shop.courses[0] && (
            <span className="text-xs font-bold text-red-600">{shop.courses[0].price}~</span>
          )}
        </div>
      </div>
    </Link>
  );
}
