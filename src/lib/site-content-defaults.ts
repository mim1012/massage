import type { HomeSeoContent, SiteSettings } from '@/lib/types';

export const LEGACY_EN_SITE_SETTINGS: SiteSettings = {
  siteName: 'Healing Finder',
  siteTitle: 'Massage Directory',
  siteDescription: 'Verified wellness listings',
  heroMainText: 'Find a trusted massage spot near you',
  heroSubText: 'Verified listings, curated by area and theme',
  contactPhone: '1588-0000',
  footerInfo: 'Healing Finder | Wellness directory team | Business info placeholder',
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: '힐링 파인더',
  siteTitle: '마사지·웰니스 제휴업소 찾기',
  siteDescription: '지역과 테마별 검증된 웰니스 업소 정보',
  heroMainText: '내 주변 믿을 수 있는 마사지 업소를 찾아보세요',
  heroSubText: '지역과 테마별로 검증된 업소만 선별해 소개합니다',
  contactPhone: '1588-0000',
  footerInfo: '힐링 파인더 | 마사지·웰니스 제휴업소 안내 | 사업자 정보 준비 중',
};

export const LEGACY_EN_HOME_SEO: HomeSeoContent = {
  section1Title: 'Healing Finder: discover massage and wellness shops',
  section1Content:
    'Browse verified massage and wellness listings by area, theme, and popularity. Compare options quickly and move into each shop page for details.',
  section2Title: 'Filter by district and service type',
  section2Content:
    'Use region, district, and theme filters to narrow down Swedish, aroma, Thai, sports, or deep-tissue options across major cities.',
  section3Title: 'Track premium and trending listings',
  section3Content:
    'Premium placements and ranking pages make it easier to scan top-performing shops while keeping the core directory searchable.',
};

export const DEFAULT_HOME_SEO: HomeSeoContent = {
  section1Title: '힐링 파인더: 마사지·웰니스 업소를 한눈에 찾아보세요',
  section1Content:
    '지역, 테마, 인기 순위 기준으로 검증된 마사지 및 웰니스 업소를 빠르게 살펴보고 각 업소 상세 페이지에서 핵심 정보를 비교해보세요.',
  section2Title: '지역과 서비스 유형으로 원하는 업소를 좁혀보세요',
  section2Content:
    '서울, 경기 등 주요 지역과 세부 상권, 스웨디시·아로마·타이·스포츠·딥티슈 같은 테마 필터를 조합해 원하는 업소를 손쉽게 찾을 수 있습니다.',
  section3Title: '프리미엄 추천과 인기 업소 흐름까지 확인하세요',
  section3Content:
    '프리미엄 노출과 랭킹형 구성을 통해 주목할 만한 업소를 빠르게 훑으면서도 기본 디렉터리 탐색 경험은 그대로 유지할 수 있습니다.',
};

function replaceLegacyValues<T extends object>(
  current: T,
  legacy: T,
  replacement: T,
  keys: Array<keyof T>,
): T {
  const normalized = { ...current };

  for (const key of keys) {
    if (current[key] === legacy[key]) {
      normalized[key] = replacement[key];
    }
  }

  return normalized;
}

export function normalizeSiteSettings(settings: SiteSettings) {
  return replaceLegacyValues(settings, LEGACY_EN_SITE_SETTINGS, DEFAULT_SITE_SETTINGS, [
    'siteName',
    'siteTitle',
    'siteDescription',
    'heroMainText',
    'heroSubText',
    'contactPhone',
    'footerInfo',
  ]);
}

export function normalizeHomeSeo(content: HomeSeoContent) {
  return replaceLegacyValues(content, LEGACY_EN_HOME_SEO, DEFAULT_HOME_SEO, [
    'section1Title',
    'section1Content',
    'section2Title',
    'section2Content',
    'section3Title',
    'section3Content',
  ]);
}
