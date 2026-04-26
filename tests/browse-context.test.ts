import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildShopBrowseHref, buildShopDetailHref, getShopBrowseLabel, getTop100FilterTitle, getTop100RankingLabel } from '@/lib/browse-context';

test('getTop100FilterTitle avoids duplicated 전체 labels', () => {
  assert.equal(getTop100FilterTitle({ regionLabel: '전체' }), '전체');
  assert.equal(getTop100FilterTitle({ regionLabel: '전체', subRegionLabel: '', themeLabel: undefined }), '전체');
  assert.equal(getTop100FilterTitle({ regionLabel: '전체', subRegionLabel: '', themeLabel: '전체' }), '전체');
  assert.equal(getTop100FilterTitle({ regionLabel: '서울', subRegionLabel: '', themeLabel: undefined }), '서울');
  assert.equal(getTop100FilterTitle({ regionLabel: '서울', subRegionLabel: '강남', themeLabel: '스웨디시' }), '서울 강남 스웨디시');
});

test('top100 headings use 전국 fallback only when filter title is 전체', () => {
  assert.equal(getTop100RankingLabel('전체'), '전국');
  assert.equal(getTop100RankingLabel('서울 강남'), '서울 강남');
});

test('buildShopBrowseHref preserves browse context for region and theme entry modes', () => {
  assert.equal(buildShopBrowseHref({ region: 'seoul' }), '/?region=seoul');
  assert.equal(
    buildShopBrowseHref({ mode: 'theme', region: 'seoul', theme: 'swedish' }),
    '/?view=theme&region=seoul&theme=swedish',
  );
  assert.equal(
    buildShopBrowseHref({ mode: 'theme', region: 'seoul', subRegion: 'gangnam', theme: 'swedish' }),
    '/?view=theme&region=seoul&subRegion=gangnam&theme=swedish',
  );
});

test('buildShopDetailHref preserves browse context when entering a detail page from theme mode', () => {
  assert.equal(buildShopDetailHref('gangnam-healing-spa'), '/shop/gangnam-healing-spa');
  assert.equal(
    buildShopDetailHref('gangnam-healing-spa', { mode: 'theme', region: 'seoul', theme: 'swedish' }),
    '/shop/gangnam-healing-spa?view=theme&region=seoul&theme=swedish',
  );
  assert.equal(
    buildShopDetailHref('gangnam-healing-spa', {
      mode: 'theme',
      region: 'seoul',
      subRegion: 'gangnam',
      theme: 'swedish',
    }),
    '/shop/gangnam-healing-spa?view=theme&region=seoul&subRegion=gangnam&theme=swedish',
  );
});

test('getShopBrowseLabel matches the preserved browse context', () => {
  assert.equal(
    getShopBrowseLabel({
      mode: 'theme',
      theme: 'swedish',
      fallbackRegionLabel: '서울',
      fallbackThemeLabel: '스웨디시',
    }),
    '스웨디시',
  );
  assert.equal(
    getShopBrowseLabel({
      mode: 'region',
      region: 'seoul',
      subRegion: 'gangnam',
      fallbackRegionLabel: '서울',
      fallbackThemeLabel: '스웨디시',
      subRegionLabel: '강남',
    }),
    '강남',
  );
});
