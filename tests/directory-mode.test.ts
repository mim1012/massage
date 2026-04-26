import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildBrowseHref, getDirectoryMode } from '@/lib/directory-mode';

test('getDirectoryMode returns theme only for explicit theme view', () => {
  assert.equal(getDirectoryMode('theme'), 'theme');
  assert.equal(getDirectoryMode('list'), 'region');
  assert.equal(getDirectoryMode(null), 'region');
  assert.equal(getDirectoryMode('unexpected'), 'region');
});

test('buildBrowseHref preserves theme mode while switching filters', () => {
  assert.equal(buildBrowseHref({ mode: 'theme' }), '/?view=theme');
  assert.equal(buildBrowseHref({ mode: 'theme', theme: 'swedish' }), '/?view=theme&theme=swedish');
  assert.equal(buildBrowseHref({ mode: 'theme', region: 'seoul' }), '/?view=theme&region=seoul');
  assert.equal(
    buildBrowseHref({ mode: 'theme', region: 'seoul', subRegion: 'gangnam', q: '아로마' }),
    '/?view=theme&region=seoul&subRegion=gangnam&q=%EC%95%84%EB%A1%9C%EB%A7%88',
  );
});

test('buildBrowseHref omits list view but keeps non-default filters', () => {
  assert.equal(buildBrowseHref({ mode: 'region' }), '/');
  assert.equal(buildBrowseHref({ mode: 'region', region: 'busan' }), '/?region=busan');
  assert.equal(buildBrowseHref({ mode: 'region', theme: 'thai', sort: 'popular' }), '/?theme=thai&sort=popular');
});
