type ReviewPaginationStateInput = {
  searchQuery: string;
  initialKeyword: string;
  searchType: 'all' | 'shop' | 'author' | 'content';
  initialSearchType: 'all' | 'shop' | 'author' | 'content';
  regionTab: string;
  initialRegionTab: string;
  shopTab: string;
  initialShopTab: string;
};

export function shouldUseServerPagination({
  searchQuery,
  initialKeyword,
  searchType,
  initialSearchType,
  regionTab,
  initialRegionTab,
  shopTab,
  initialShopTab,
}: ReviewPaginationStateInput) {
  return (
    searchType === initialSearchType &&
    searchQuery.trim() === initialKeyword.trim() &&
    regionTab === initialRegionTab &&
    shopTab === initialShopTab
  );
}
