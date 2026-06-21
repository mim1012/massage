'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { DISTRICTS } from '@/lib/catalog';
import { buildShopBrowseHref, getShopBrowseLabel } from '@/lib/browse-context';

type ShopBrowseBreadcrumbsProps = {
  shopName: string;
  shopRegion: string;
  shopRegionLabel: string;
  shopSubRegion?: string;
  shopTheme: string;
  shopThemeLabel: string;
};

export default function ShopBrowseBreadcrumbs({
  shopName,
  shopRegion,
  shopRegionLabel,
  shopSubRegion,
  shopTheme,
  shopThemeLabel,
}: ShopBrowseBreadcrumbsProps) {
  const searchParams = useSearchParams();

  const { browseHref, browseLabel } = useMemo(() => {
    const source = searchParams.get('source') === 'top100' ? 'top100' : 'home';
    const currentRegion = searchParams.get('region');
    const currentSubRegion = searchParams.get('subRegion');
    const currentTheme = searchParams.get('theme');
    const preservedMode = searchParams.get('view') === 'theme' && currentTheme === shopTheme ? 'theme' : 'region';
    const preservedRegion =
      source === 'top100'
        ? currentRegion === shopRegion
          ? currentRegion
          : undefined
        : currentRegion === shopRegion
          ? currentRegion
          : shopRegion;
    const preservedSubRegion = currentSubRegion && currentSubRegion === shopSubRegion ? currentSubRegion : undefined;
    const preservedTheme = currentTheme && currentTheme === shopTheme ? currentTheme : undefined;

    return {
      browseHref: buildShopBrowseHref({
        mode: preservedMode,
        source,
        region: preservedRegion,
        subRegion: preservedSubRegion,
        theme: preservedTheme,
      }),
      browseLabel: getShopBrowseLabel({
        mode: preservedMode,
        source,
        region: preservedRegion,
        subRegion: preservedSubRegion,
        theme: preservedTheme,
        fallbackRegionLabel: shopRegionLabel,
        fallbackThemeLabel: shopThemeLabel,
        subRegionLabel:
          currentRegion && currentSubRegion
            ? DISTRICTS[currentRegion]?.find((district) => district.code === currentSubRegion)?.label
            : undefined,
      }),
    };
  }, [searchParams, shopRegion, shopRegionLabel, shopSubRegion, shopTheme, shopThemeLabel]);

  return (
    <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
      <Link href="/" className="hover:text-[var(--portal-brand)]">
        홈
      </Link>
      <ChevronRight className="h-3 w-3" />
      <Link href={browseHref} className="hover:text-[var(--portal-brand)]">
        {browseLabel}
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="font-medium text-gray-800">{shopName}</span>
    </div>
  );
}
