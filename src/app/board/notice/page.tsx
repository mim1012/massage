import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import { listNotices } from '@/lib/server/communityStore';
import type { Notice } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: '공지사항',
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams?: Promise<{
    q?: string;
  }>;
}

export default async function NoticePage({ searchParams }: Props) {
  const notices = await listNotices();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const keyword = resolvedSearchParams?.q?.trim() ?? '';
  const normalizedKeyword = keyword.toLowerCase();
  const filteredNotices = normalizedKeyword
    ? notices.filter((notice) => [notice.title, notice.content].some((value) => value.toLowerCase().includes(normalizedKeyword)))
    : notices;

  return (
    <div className="mx-auto max-w-[800px] px-3 py-4">
      <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
        <Link href="/" className="hover:text-red-600">
          홈
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/board" className="hover:text-red-600">
          게시판
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800">공지사항</span>
      </div>
      <h1 className="mb-3 text-lg font-black text-gray-800">공지사항</h1>

      <form className="mb-3 rounded border border-gray-200 bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={keyword}
              placeholder="제목이나 내용으로 검색"
              className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-red-500"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-gray-800 px-4 py-2 text-sm font-bold text-white hover:bg-black">
              검색
            </button>
            {keyword ? (
              <Link
                href="/board/notice"
                className="rounded border border-gray-300 px-3 py-2 text-sm font-bold text-gray-600 hover:border-red-300 hover:text-red-600"
              >
                초기화
              </Link>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          총 {filteredNotices.length}개의 공지
          {keyword ? <span> · “{keyword}” 검색 결과</span> : null}
        </p>
      </form>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        {filteredNotices.map((notice: Notice, index: number) => (
          <Link
            key={notice.id}
            href={`/board/notice/${notice.id}`}
            className={`flex items-center justify-between p-3 transition-all hover:bg-gray-50 ${
              index < filteredNotices.length - 1 ? 'border-b border-gray-100' : ''
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
        {filteredNotices.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            {keyword ? '검색 조건에 맞는 공지사항이 없습니다.' : '등록된 공지사항이 없습니다.'}
          </div>
        ) : null}
      </div>
    </div>
  );
}
