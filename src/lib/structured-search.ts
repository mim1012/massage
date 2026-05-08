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

  // First, try matching the full query as a single key (legacy behavior)
  const fullKey = normalizeStructuredSearchKey(trimmedQuery);
  const fullRegion = regionSearchMap.get(fullKey);
  const fullTheme = themeSearchMap.get(fullKey);
  const fullDistrict = districtSearchMap.get(fullKey);

  if (fullRegion || fullTheme || fullDistrict) {
    return {
      region: fullRegion ?? fullDistrict?.region,
      subRegion: fullDistrict?.subRegion,
      theme: fullTheme,
    };
  }

  // If no full match, try matching tokens (e.g., "Gangnam Swedish")
  const tokens = trimmedQuery.split(/\s+/);
  const intent: StructuredSearchIntent = {};
  const unmatchedTokens: string[] = [];

  for (const token of tokens) {
    const tokenKey = normalizeStructuredSearchKey(token);
    const tokenRegion = regionSearchMap.get(tokenKey);
    const tokenTheme = themeSearchMap.get(tokenKey);
    const tokenDistrict = districtSearchMap.get(tokenKey);

    let matched = false;
    if (tokenRegion && !intent.region) {
      intent.region = tokenRegion;
      matched = true;
    }
    if (tokenDistrict) {
      if (!intent.region) intent.region = tokenDistrict.region;
      if (!intent.subRegion) intent.subRegion = tokenDistrict.subRegion;
      matched = true;
    }
    if (tokenTheme && !intent.theme) {
      intent.theme = tokenTheme;
      matched = true;
    }

    if (!matched) {
      unmatchedTokens.push(token);
    }
  }

  if (unmatchedTokens.length > 0) {
    intent.freeText = unmatchedTokens.join(' ');
  }

  // If we found nothing structured, return as free text
  if (!intent.region && !intent.theme && !intent.subRegion) {
    return { freeText: trimmedQuery };
  }

  return intent;
}
