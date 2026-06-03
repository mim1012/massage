import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { listNotices } from '@/lib/server/communityStore';
import { formatDate } from '@/lib/utils';
import { normalizePageParam, paginateItems, getTotalPages } from '@/lib/pagination';
import PaginationControls from '@/components/public/PaginationControls';

export const metadata: Metadata = { title: '공지사항' };

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<{
    page?: SearchParamValue;
  }>;
};

function pickFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

const PAGE_SIZE = 20;

export default async function NoticePage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = normalizePageParam(pickFirst(resolvedSearchParams?.page));
  const allNotices = await listNotices();
  const totalPages = getTotalPages(allNotices.length, PAGE_SIZE);
  const notices = paginateItems(allNotices, page, PAGE_SIZE);

  return (
    <div className="max-w-[800px] mx-auto px-3 py-4">
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link href="/" className="hover:text-red-600">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/board" className="hover:text-red-600">게시판</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800">공지사항</span>
      </div>
      <h1 className="text-lg font-black text-gray-800 mb-3">📢 공지사항</h1>
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {notices.map((notice, idx) => (
          <Link key={notice.id} href={`/board/notice/${notice.id}`}
            className={`flex items-center justify-between p-3 hover:bg-gray-50 transition-all ${idx < notices.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <div className="flex items-center gap-2 min-w-0">
              {notice.isPinned && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded shrink-0">공지</span>}
              <span className="text-sm text-gray-700 truncate font-medium">{notice.title}</span>
            </div>
            <span className="text-[11px] text-gray-400 shrink-0 ml-3">{formatDate(notice.createdAt)}</span>
          </Link>
        ))}
      </div>
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        buildHref={(p) => `/board/notice${p > 1 ? `?page=${p}` : ''}`}
      />
    </div>
  );
}
