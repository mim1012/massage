import { deriveStructuredSearchIntent } from '@/lib/structured-search';

export type DirectoryMode = 'region' | 'theme';

type SearchParamValue = string | string[] | null | undefined;

type DirectoryQueryBase = {
  region?: string;
  subRegion?: string;
  theme?: string;
  q?: string;
  sort?: string;
};

type DirectoryQueryInput = {
  region?: SearchParamValue;
  subRegion?: SearchParamValue;
  theme?: SearchParamValue;
  q?: SearchParamValue;
  sort?: SearchParamValue;
};

type DirectoryQuery = DirectoryQueryBase & {
  mode: DirectoryMode;
};

type DirectoryQuerySource =
  | {
      get(name: string): string | null;
    }
  | Record<string, SearchParamValue>
  | null
  | undefined;

type DirectorySearchParamsOptions = DirectoryQueryInput & {
  mode?: DirectoryMode;
  extraParams?: Record<string, string | number | null | undefined>;
};

type DirectoryCanonicalRedirectOptions = DirectoryQuery & {
  basePath?: string;
  extraParams?: Record<string, string | number | null | undefined>;
};

type BrowseHrefOptions = DirectoryQueryInput & {
  mode?: DirectoryMode;
  basePath?: string;
};

function isMeaningful(value?: string | null) {
  return Boolean(value && value !== 'all');
}

function normalizeSingleValue(value: SearchParamValue) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const normalized = candidate?.trim();
  return normalized ? normalized : undefined;
}

function readSearchParam(source: DirectoryQuerySource, key: string) {
  if (!source) {
    return undefined;
  }

  if ('get' in source && typeof source.get === 'function') {
    return normalizeSingleValue(source.get(key));
  }

  return normalizeSingleValue((source as Record<string, SearchParamValue>)[key]);
}

function resolveDirectoryQuery({ region, subRegion, theme, q, sort, mode = 'region' }: DirectorySearchParamsOptions): DirectoryQuery {
  return {
    mode,
    region: normalizeSingleValue(region),
    subRegion: normalizeSingleValue(subRegion),
    theme: normalizeSingleValue(theme),
    q: normalizeSingleValue(q),
    sort: normalizeSingleValue(sort),
  };
}

export function getDirectoryMode(view: string | null | undefined): DirectoryMode {
  return view === 'theme' ? 'theme' : 'region';
}

export function parseDirectoryQuery(source: DirectoryQuerySource): DirectoryQuery {
  return resolveDirectoryQuery({
    mode: getDirectoryMode(readSearchParam(source, 'view')),
    region: readSearchParam(source, 'region'),
    subRegion: readSearchParam(source, 'subRegion'),
    theme: readSearchParam(source, 'theme'),
    q: readSearchParam(source, 'q'),
    sort: readSearchParam(source, 'sort'),
  });
}

export function buildDirectorySearchParams({
  mode = 'region',
  region,
  subRegion,
  theme,
  q,
  sort,
  extraParams,
}: DirectorySearchParamsOptions) {
  const params = new URLSearchParams();

  if (mode === 'theme') {
    params.set('view', 'theme');
  }

  const resolvedQuery = resolveDirectoryQuery({ mode, region, subRegion, theme, q, sort });
  const searchIntent = deriveStructuredSearchIntent(resolvedQuery.q);
  const resolvedRegion = isMeaningful(resolvedQuery.region) ? resolvedQuery.region : searchIntent.region;
  const resolvedSubRegion = isMeaningful(resolvedQuery.subRegion) ? resolvedQuery.subRegion : searchIntent.subRegion;
  const resolvedTheme = isMeaningful(resolvedQuery.theme) ? resolvedQuery.theme : searchIntent.theme;

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

  if (resolvedQuery.sort && resolvedQuery.sort !== 'random') {
    params.set('sort', resolvedQuery.sort);
  }

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    }
  }

  return params;
}

export function getDirectoryCanonicalRedirect({
  basePath = '/',
  mode,
  region,
  subRegion,
  theme,
  q,
  sort,
  extraParams,
}: DirectoryCanonicalRedirectOptions) {
  const resolvedQuery = resolveDirectoryQuery({ mode, region, subRegion, theme, q, sort });
  const searchIntent = deriveStructuredSearchIntent(resolvedQuery.q);
  const shouldRedirect = Boolean(
    resolvedQuery.q &&
      !searchIntent.freeText &&
      !resolvedQuery.region &&
      !resolvedQuery.subRegion &&
      !resolvedQuery.theme &&
      (searchIntent.region || searchIntent.subRegion || searchIntent.theme),
  );

  if (!shouldRedirect) {
    return null;
  }

  const params = buildDirectorySearchParams({
    mode,
    region: searchIntent.region,
    subRegion: searchIntent.subRegion,
    theme: searchIntent.theme,
    sort,
    extraParams,
  });
  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
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
  const params = buildDirectorySearchParams({ mode, region, subRegion, theme, q, sort });
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
