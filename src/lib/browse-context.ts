import { buildBrowseHref, type DirectoryMode } from '@/lib/directory-mode';

type Top100FilterTitleOptions = {
  regionLabel: string;
  subRegionLabel?: string;
  themeLabel?: string;
};

type BrowseContextOptions = {
  mode?: DirectoryMode;
  region?: string;
  subRegion?: string;
  theme?: string;
};

type ShopBrowseHrefOptions = BrowseContextOptions & {
  region: string;
};

type ShopBrowseLabelOptions = BrowseContextOptions & {
  fallbackRegionLabel: string;
  fallbackThemeLabel: string;
  subRegionLabel?: string;
};

export function getTop100FilterTitle({ regionLabel, subRegionLabel = '', themeLabel }: Top100FilterTitleOptions) {
  const normalizedThemeLabel = themeLabel === '전체' ? undefined : themeLabel;

  if (regionLabel === '전체' && !subRegionLabel && !normalizedThemeLabel) {
    return '전체';
  }

  return `${regionLabel}${subRegionLabel ? ` ${subRegionLabel}` : ''}${normalizedThemeLabel ? ` ${normalizedThemeLabel}` : ''}`;
}

export function getTop100RankingLabel(filterTitle: string) {
  return filterTitle === '전체' ? '전국' : filterTitle;
}

export function buildShopBrowseHref({ mode = 'region', region, subRegion, theme }: ShopBrowseHrefOptions) {
  return buildBrowseHref({
    mode,
    region,
    subRegion,
    theme,
  });
}

export function getShopBrowseLabel({
  mode = 'region',
  region,
  subRegion,
  theme,
  fallbackRegionLabel,
  fallbackThemeLabel,
  subRegionLabel,
}: ShopBrowseLabelOptions) {
  if (mode === 'theme') {
    return fallbackThemeLabel;
  }

  if (subRegion && subRegion !== 'all' && subRegionLabel) {
    return subRegionLabel;
  }

  if (region && region !== 'all') {
    return fallbackRegionLabel;
  }

  return fallbackRegionLabel;
}

export function buildShopDetailHref(slug: string, { mode = 'region', region, subRegion, theme }: BrowseContextOptions = {}) {
  const params = new URLSearchParams();

  if (mode === 'theme') {
    params.set('view', 'theme');
  }

  if (region && region !== 'all') {
    params.set('region', region);
  }

  if (subRegion && subRegion !== 'all') {
    params.set('subRegion', subRegion);
  }

  if (theme && theme !== 'all') {
    params.set('theme', theme);
  }

  const query = params.toString();
  return query ? `/shop/${slug}?${query}` : `/shop/${slug}`;
}
