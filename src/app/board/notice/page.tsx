import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { listNotices } from '@/lib/server/communityStore';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Notice',
};

export default function NoticePage() {
  const notices = listNotices();

  return (
    <div className="mx-auto max-w-[800px] px-3 py-4">
      <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
        <Link href="/" className="hover:text-red-600">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/board" className="hover:text-red-600">
          Board
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800">Notice</span>
      </div>
      <h1 className="mb-3 text-lg font-black text-gray-800">공지사항</h1>
      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        {notices.map((notice, index) => (
          <Link
            key={notice.id}
            href={`/board/notice/${notice.id}`}
            className={`flex items-center justify-between p-3 transition-all hover:bg-gray-50 ${
              index < notices.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              {notice.isPinned && (
                <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                  공지
                </span>
              )}
              <span className="truncate text-sm font-medium text-gray-700">{notice.title}</span>
            </div>
            <span className="ml-3 shrink-0 text-[11px] text-gray-400">{formatDate(notice.createdAt)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
