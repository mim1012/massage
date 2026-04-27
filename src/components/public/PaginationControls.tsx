import Link from 'next/link';
import { getPaginationRange } from '@/lib/pagination';

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  buildHref?: (page: number) => string;
};

export default function PaginationControls({ currentPage, totalPages, onPageChange, buildHref }: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPaginationRange(currentPage, totalPages);

  function renderItem(page: number, label?: string) {
    const isActive = page === currentPage;
    const className = `inline-flex min-w-9 items-center justify-center rounded border px-3 py-1.5 text-xs font-bold transition-colors ${
      isActive
        ? 'border-red-600 bg-red-600 text-white'
        : 'border-gray-300 bg-white text-gray-600 hover:border-red-300 hover:text-red-600'
    }`;
    const content = label ?? String(page);

    if (buildHref) {
      return (
        <Link key={`${label ?? page}-${page}`} href={buildHref(page)} className={className} aria-current={isActive ? 'page' : undefined}>
          {content}
        </Link>
      );
    }

    return (
      <button
        key={`${label ?? page}-${page}`}
        type="button"
        onClick={() => onPageChange?.(page)}
        className={className}
        aria-current={isActive ? 'page' : undefined}
      >
        {content}
      </button>
    );
  }

  return (
    <nav className="mt-4 flex flex-wrap items-center justify-center gap-1.5" aria-label="페이지네이션">
      {currentPage > 1 ? renderItem(currentPage - 1, '이전') : null}
      {pages.map((page) => renderItem(page))}
      {currentPage < totalPages ? renderItem(currentPage + 1, '다음') : null}
    </nav>
  );
}
