import { DISTRICTS, REGIONS, THEMES } from '@/lib/catalog';

export type StructuredSearchIntent = {
  region?: string;
  subRegion?: string;
  theme?: string;
  freeText?: string;
};

export function normalizeStructuredSearchKey(value: string) {
  return value.trim().replaceAll(/\s+/g, '').toLowerCase();
}

const regionSearchMap = new Map<string, string>(
  REGIONS.filter((region) => region.code !== 'all').flatMap((region) => [
    [normalizeStructuredSearchKey(region.code), region.code],
    [normalizeStructuredSearchKey(region.label), region.code],
  ]),
);

const themeSearchMap = new Map<string, string>(
  THEMES.filter((theme) => theme.code !== 'all').flatMap((theme) => [
    [normalizeStructuredSearchKey(theme.code), theme.code],
    [normalizeStructuredSearchKey(theme.label), theme.code],
  ]),
);

const districtCandidates = new Map<string, { region: string; subRegion: string }[]>();
for (const [region, districts] of Object.entries(DISTRICTS)) {
  for (const district of districts) {
    if (district.code === 'all') {
      continue;
    }

    for (const key of [normalizeStructuredSearchKey(district.code), normalizeStructuredSearchKey(district.label)]) {
      const existing = districtCandidates.get(key) ?? [];
      existing.push({ region, subRegion: district.code });
      districtCandidates.set(key, existing);
    }
  }
}

const districtSearchMap = new Map<string, { region: string; subRegion: string } | null>(
  [...districtCandidates.entries()].map(([key, candidates]) => {
    const unique = new Map(candidates.map((candidate) => [`${candidate.region}:${candidate.subRegion}`, candidate]));
    return [key, unique.size === 1 ? [...unique.values()][0] : null] as const;
  }),
);

export function deriveStructuredSearchIntent(query?: string | null): StructuredSearchIntent {
  const trimmedQuery = query?.trim();
  if (!trimmedQuery) {
    return {};
  }

  const key = normalizeStructuredSearchKey(trimmedQuery);
  const region = regionSearchMap.get(key);
  const theme = themeSearchMap.get(key);
  const district = districtSearchMap.get(key);

  if (!region && !theme && !district) {
    return { freeText: trimmedQuery };
  }

  return {
    region: region ?? district?.region,
    subRegion: district?.subRegion,
    theme,
  };
}
