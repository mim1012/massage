import type { Shop } from '@/lib/types';

export type DirectorySortType = 'random' | 'popular' | 'new';

function shuffleRegularShops(shops: Shop[]) {
  const copy = [...shops];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function getDirectorySortType(sort: string | null | undefined): DirectorySortType {
  if (sort === 'popular' || sort === 'new') {
    return sort;
  }

  return 'random';
}

export function sortRegularShops(shops: Shop[], sortType: DirectorySortType) {
  if (sortType === 'popular') {
    return [...shops].sort((left, right) => {
      if (right.reviewCount !== left.reviewCount) {
        return right.reviewCount - left.reviewCount;
      }
      if (right.rating !== left.rating) {
        return right.rating - left.rating;
      }
      return right.createdAt.localeCompare(left.createdAt);
    });
  }

  if (sortType === 'new') {
    return [...shops].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  return shuffleRegularShops(shops);
}
