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
  siteName: '힐링찾기',
  siteTitle: '전국 제휴업소 디렉토리',
  siteDescription: 'HEALING DIRECTORY',
  heroMainText: '🔥 내 주변 최고의 힐링 업소 찾기',
  heroSubText: '전국 500개+ 제휴업소 | 매일 업데이트되는 검증된 정보',
  contactPhone: '1588-0000',
  footerInfo: '힐링찾기 | 대표자: 홍길동 | 사업자번호: 000-00-00000 | 서울특별시 강남구 테헤란로 123',
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
  section1Title: '힐링찾기 - 전국 마사지·힐링업소 디렉토리',
  section1Content:
    '힐링찾기는 전국 마사지·힐링 제휴업소를 지역별·테마별로 한눈에 비교할 수 있는 디렉토리 플랫폼입니다. 서울, 경기, 부산 등 전국 주요 도시의 검증된 업소를 소개합니다.',
  section2Title: '지역별 마사지 업소 찾기',
  section2Content:
    '강남, 홍대, 해운대 등 인기 지역부터 수원, 인천, 대전까지 다양한 지역의 업소를 손쉽게 검색하세요. 스웨디시, 아로마, 타이, 스포츠 마사지 등 테마별 필터로 원하는 업소를 빠르게 찾을 수 있습니다.',
  section3Title: '프리미엄 추천업소',
  section3Content:
    '매일 업데이트되는 프리미엄 추천업소를 통해 최고 수준의 서비스를 경험하세요. 업소 상세 페이지에서 코스 정보, 요금표, 실제 방문 후기를 확인할 수 있습니다.',
};

function normalizeField(value: unknown, legacyValue: string, defaultValue: string) {
  const trimmed = typeof value === 'string' ? value.trim() : '';

  if (!trimmed || trimmed === legacyValue) {
    return defaultValue;
  }

  return trimmed;
}

export function normalizeSiteSettings(settings?: Partial<SiteSettings> | null) {
  const safeSettings = settings ?? {};

  return {
    siteName: normalizeField(safeSettings.siteName, LEGACY_EN_SITE_SETTINGS.siteName, DEFAULT_SITE_SETTINGS.siteName),
    siteTitle: normalizeField(safeSettings.siteTitle, LEGACY_EN_SITE_SETTINGS.siteTitle, DEFAULT_SITE_SETTINGS.siteTitle),
    siteDescription: normalizeField(safeSettings.siteDescription, LEGACY_EN_SITE_SETTINGS.siteDescription, DEFAULT_SITE_SETTINGS.siteDescription),
    heroMainText: normalizeField(safeSettings.heroMainText, LEGACY_EN_SITE_SETTINGS.heroMainText, DEFAULT_SITE_SETTINGS.heroMainText),
    heroSubText: normalizeField(safeSettings.heroSubText, LEGACY_EN_SITE_SETTINGS.heroSubText, DEFAULT_SITE_SETTINGS.heroSubText),
    contactPhone: normalizeField(safeSettings.contactPhone, LEGACY_EN_SITE_SETTINGS.contactPhone, DEFAULT_SITE_SETTINGS.contactPhone),
    footerInfo: normalizeField(safeSettings.footerInfo, LEGACY_EN_SITE_SETTINGS.footerInfo, DEFAULT_SITE_SETTINGS.footerInfo),
  };
}

export function normalizeHomeSeo(content?: Partial<HomeSeoContent> | null) {
  const safeContent = content ?? {};

  return {
    section1Title: normalizeField(safeContent.section1Title, LEGACY_EN_HOME_SEO.section1Title, DEFAULT_HOME_SEO.section1Title),
    section1Content: normalizeField(safeContent.section1Content, LEGACY_EN_HOME_SEO.section1Content, DEFAULT_HOME_SEO.section1Content),
    section2Title: normalizeField(safeContent.section2Title, LEGACY_EN_HOME_SEO.section2Title, DEFAULT_HOME_SEO.section2Title),
    section2Content: normalizeField(safeContent.section2Content, LEGACY_EN_HOME_SEO.section2Content, DEFAULT_HOME_SEO.section2Content),
    section3Title: normalizeField(safeContent.section3Title, LEGACY_EN_HOME_SEO.section3Title, DEFAULT_HOME_SEO.section3Title),
    section3Content: normalizeField(safeContent.section3Content, LEGACY_EN_HOME_SEO.section3Content, DEFAULT_HOME_SEO.section3Content),
  };
}
