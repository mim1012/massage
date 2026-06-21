import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldUseServerPagination } from '@/components/public/review-pagination-state';

test('shouldUseServerPagination stays true for untouched server-backed keyword and shop filters', () => {
  assert.equal(
    shouldUseServerPagination({
      searchQuery: '테스트',
      initialKeyword: '테스트',
      searchType: 'all',
      initialSearchType: 'all',
      regionTab: 'gangnam',
      initialRegionTab: 'gangnam',
      shopTab: 'shop-1',
      initialShopTab: 'shop-1',
    }),
    true,
  );

  assert.equal(
    shouldUseServerPagination({
      searchQuery: '후기',
      initialKeyword: '후기',
      searchType: 'author',
      initialSearchType: 'author',
      regionTab: 'all',
      initialRegionTab: 'all',
      shopTab: 'all',
      initialShopTab: 'all',
    }),
    true,
  );
});

test('shouldUseServerPagination turns false when the user changes client-side filters', () => {
  assert.equal(
    shouldUseServerPagination({
      searchQuery: '테스트',
      initialKeyword: '테스트',
      searchType: 'content',
      initialSearchType: 'all',
      regionTab: 'gangnam',
      initialRegionTab: 'gangnam',
      shopTab: 'shop-1',
      initialShopTab: 'shop-1',
    }),
    false,
  );

  assert.equal(
    shouldUseServerPagination({
      searchQuery: '새 키워드',
      initialKeyword: '테스트',
      searchType: 'all',
      initialSearchType: 'all',
      regionTab: 'gangnam',
      initialRegionTab: 'gangnam',
      shopTab: 'shop-1',
      initialShopTab: 'shop-1',
    }),
    false,
  );

  assert.equal(
    shouldUseServerPagination({
      searchQuery: '',
      initialKeyword: '',
      searchType: 'all',
      initialSearchType: 'all',
      regionTab: 'busan',
      initialRegionTab: 'all',
      shopTab: 'all',
      initialShopTab: 'all',
    }),
    false,
  );
});
