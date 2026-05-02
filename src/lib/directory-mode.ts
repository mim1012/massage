import { deriveStructuredSearchIntent } from '@/lib/structured-search';

export type DirectoryMode = 'region' | 'theme';

type BrowseHrefOptions = {
  mode?: DirectoryMode;
  basePath?: string;
  region?: string | null;
  subRegion?: string | null;
  theme?: string | null;
  q?: string | null;
  sort?: string | null;
};

function isMeaningful(value?: string | null) {
  return Boolean(value && value !== 'all');
}

export function getDirectoryMode(view: string | null | undefined): DirectoryMode {
  return view === 'theme' ? 'theme' : 'region';
}

export function buildBrowseHref({
  mode = 'region',
  basePath = '/',
  region,
  subRegion,
  theme,
  q,
  sort,
}: BrowseHrefOptions) {
  const params = new URLSearchParams();

  if (mode === 'theme') {
    params.set('view', 'theme');
  }

  const searchIntent = deriveStructuredSearchIntent(q);
  const resolvedRegion = isMeaningful(region) ? region! : searchIntent.region;
  const resolvedSubRegion = isMeaningful(subRegion) ? subRegion! : searchIntent.subRegion;
  const resolvedTheme = isMeaningful(theme) ? theme! : searchIntent.theme;

  if (resolvedRegion && resolvedRegion !== 'all') {
    params.set('region', resolvedRegion);
  }

  if (resolvedSubRegion && resolvedSubRegion !== 'all') {
    params.set('subRegion', resolvedSubRegion);
  }

  if (resolvedTheme && resolvedTheme !== 'all') {
    params.set('theme', resolvedTheme);
  }

  if (searchIntent.freeText) {
    params.set('q', searchIntent.freeText);
  }

  if (sort && sort !== 'random') {
    params.set('sort', sort);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
