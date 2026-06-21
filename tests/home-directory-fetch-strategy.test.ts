import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createDeferredHomeShopResponse,
  shouldAutoLoadDeferredHomeDirectory,
  shouldDeferInitialHomeDirectoryFetch,
} from '@/lib/home-directory-fetch-strategy';

test('shouldDeferInitialHomeDirectoryFetch defers only real free-text queries', () => {
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'region', query: '힐링' }), true);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'region', query: '  힐링  ' }), true);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'region', query: '서울' }), false);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'region', query: '', region: 'seoul' }), false);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'region', query: undefined, region: 'seoul' }), false);
});

test('shouldDeferInitialHomeDirectoryFetch defers broad theme landing but not narrowed theme routes', () => {
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'theme', query: undefined }), true);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'theme', region: 'seoul', query: undefined }), false);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'theme', theme: 'swedish', query: undefined }), false);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'theme', subRegion: 'gangnam', query: undefined }), false);
});

test('shouldDeferInitialHomeDirectoryFetch keeps the broad main landing server-rendered', () => {
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'region' }), false);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'region', region: 'all' }), false);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'region', region: 'seoul' }), false);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'region', subRegion: 'gangnam' }), false);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ mode: 'region', theme: 'swedish' }), false);
})

test('createDeferredHomeShopResponse returns an empty first-paint payload', () => {
  assert.deepEqual(createDeferredHomeShopResponse(), {
    allShops: [],
    premiumShops: [],
    regularShops: [],
    regularTotal: 0,
    total: 0,
  });
});

test('shouldAutoLoadDeferredHomeDirectory only auto-loads when deferred payload is empty', () => {
  assert.equal(
    shouldAutoLoadDeferredHomeDirectory({
      deferInitialDirectoryFetch: true,
      premiumCount: 0,
      regularCount: 0,
    }),
    true,
  );

  assert.equal(
    shouldAutoLoadDeferredHomeDirectory({
      deferInitialDirectoryFetch: false,
      premiumCount: 0,
      regularCount: 0,
    }),
    false,
  );

  assert.equal(
    shouldAutoLoadDeferredHomeDirectory({
      deferInitialDirectoryFetch: true,
      premiumCount: 1,
      regularCount: 0,
    }),
    false,
  );

  assert.equal(
    shouldAutoLoadDeferredHomeDirectory({
      deferInitialDirectoryFetch: true,
      premiumCount: 0,
      regularCount: 1,
    }),
    false,
  );
});
