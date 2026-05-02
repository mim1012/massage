import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import PaginationControls from '@/components/public/PaginationControls';
import { listNotices } from '@/lib/server/communityStore';
import { normalizePageParam, paginateItems, getTotalPages } from '@/lib/pagination';
import type { Notice } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: '공지사항',
};

export const dynamic = 'force-dynamic';

const NOTICE_PAGE_SIZE = 20;

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<{
    page?: SearchParamValue;
  }>;
};

function pickFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NoticePage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const currentPage = normalizePageParam(pickFirst(resolvedSearchParams?.page));
  const notices = await listNotices();
  const totalPages = getTotalPages(notices.length, NOTICE_PAGE_SIZE);
  const pagedNotices = paginateItems(notices, currentPage, NOTICE_PAGE_SIZE);

  return (
    <div className="mx-auto max-w-[800px] px-3 py-4">
      <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
        <Link href="/" prefetch={false} className="hover:text-red-600">
          홈
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/board" prefetch={false} className="hover:text-red-600">
          게시판
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800">공지사항</span>
      </div>

      <h1 className="mb-3 text-lg font-black text-gray-800">📢 공지사항</h1>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        {pagedNotices.map((notice: Notice, index: number) => (
          <Link
            key={notice.id}
            href={`/board/notice/${notice.id}`}
            prefetch={false}
            className={`flex items-center justify-between p-3 transition-all hover:bg-gray-50 ${
              index < pagedNotices.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              {notice.isPinned ? (
                <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                  공지
                </span>
              ) : null}
              <span className="truncate text-sm font-medium text-gray-700">{notice.title}</span>
            </div>
            <span className="ml-3 shrink-0 text-[11px] text-gray-400">{formatDate(notice.createdAt)}</span>
          </Link>
        ))}

        {notices.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            <p>등록된 공지사항이 없습니다.</p>
            <p className="mt-1 text-[11px] text-gray-300">새 공지가 등록되면 이곳에 표시됩니다.</p>
          </div>
        ) : null}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={(page) => (page === 1 ? '/board/notice' : `/board/notice?page=${page}`)}
      />
    </div>
  );
}