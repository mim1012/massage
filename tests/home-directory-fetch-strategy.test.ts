import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createDeferredHomeShopResponse,
  shouldAutoLoadDeferredHomeDirectory,
  shouldDeferInitialHomeDirectoryFetch,
} from '@/lib/home-directory-fetch-strategy';

test('shouldDeferInitialHomeDirectoryFetch defers only real free-text queries', () => {
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ query: '힐링' }), true);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ query: '  힐링  ' }), true);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ query: '서울' }), false);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ query: '' }), false);
  assert.equal(shouldDeferInitialHomeDirectoryFetch({ query: undefined }), false);
});

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
