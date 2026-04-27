import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_HOME_SEO,
  DEFAULT_SITE_SETTINGS,
  LEGACY_EN_HOME_SEO,
  LEGACY_EN_SITE_SETTINGS,
  normalizeHomeSeo,
  normalizeSiteSettings,
} from '@/lib/site-content-defaults';

test('normalizeSiteSettings preserves customized content but migrates legacy defaults', () => {
  assert.deepEqual(normalizeSiteSettings(LEGACY_EN_SITE_SETTINGS), DEFAULT_SITE_SETTINGS);

  const customized = normalizeSiteSettings({
    ...DEFAULT_SITE_SETTINGS,
    siteName: '맞춤 사이트명',
    siteTitle: '커스텀 제목',
    footerInfo: '커스텀 푸터',
  });

  assert.equal(customized.siteName, '맞춤 사이트명');
  assert.equal(customized.siteTitle, '커스텀 제목');
  assert.equal(customized.footerInfo, '커스텀 푸터');
});

test('normalizeHomeSeo preserves customized copy but migrates legacy english defaults', () => {
  assert.deepEqual(normalizeHomeSeo(LEGACY_EN_HOME_SEO), DEFAULT_HOME_SEO);

  const customized = normalizeHomeSeo({
    ...DEFAULT_HOME_SEO,
    section1Title: '새 SEO 제목',
    section2Content: '새 SEO 본문',
  });

  assert.equal(customized.section1Title, '새 SEO 제목');
  assert.equal(customized.section2Content, '새 SEO 본문');
});


test('normalize helpers fall back for whitespace and nullish runtime values', () => {
  const normalizedSettings = normalizeSiteSettings({
    ...DEFAULT_SITE_SETTINGS,
    siteName: '   ',
    siteTitle: null as unknown as string,
    footerInfo: undefined as unknown as string,
  });

  assert.equal(normalizedSettings.siteName, DEFAULT_SITE_SETTINGS.siteName);
  assert.equal(normalizedSettings.siteTitle, DEFAULT_SITE_SETTINGS.siteTitle);
  assert.equal(normalizedSettings.footerInfo, DEFAULT_SITE_SETTINGS.footerInfo);

  const normalizedSeo = normalizeHomeSeo({
    ...DEFAULT_HOME_SEO,
    section1Title: '   ',
    section2Content: null as unknown as string,
  });

  assert.equal(normalizedSeo.section1Title, DEFAULT_HOME_SEO.section1Title);
  assert.equal(normalizedSeo.section2Content, DEFAULT_HOME_SEO.section2Content);
});


test('normalize helpers tolerate nullish objects', () => {
  assert.deepEqual(normalizeSiteSettings(null), DEFAULT_SITE_SETTINGS);
  assert.deepEqual(normalizeHomeSeo(undefined), DEFAULT_HOME_SEO);
});
