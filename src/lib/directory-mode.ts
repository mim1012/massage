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

  if (isMeaningful(region)) {
    params.set('region', region!);
  }

  if (isMeaningful(subRegion)) {
    params.set('subRegion', subRegion!);
  }

  if (isMeaningful(theme)) {
    params.set('theme', theme!);
  }

  if (q?.trim()) {
    params.set('q', q.trim());
  }

  if (sort && sort !== 'random') {
    params.set('sort', sort);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
