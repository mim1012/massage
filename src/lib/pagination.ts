export function normalizePageParam(value: string | null | undefined, fallback = 1) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getTotalPages(totalItems: number, pageSize: number) {
  if (pageSize <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const totalPages = getTotalPages(items.length, pageSize);
  const safePage = clampPage(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}

export function getPaginationRange(currentPage: number, totalPages: number, maxVisible = 5) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = start + maxVisible - 1;

  if (end > totalPages) {
    end = totalPages;
    start = end - maxVisible + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
