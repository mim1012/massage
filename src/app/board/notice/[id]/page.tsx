import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getNoticeById } from '@/lib/server/communityStore';
import { formatDate } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const notice = await getNoticeById(id);

  return {
    title: notice?.title ?? '공지사항',
  };
}

export default async function NoticeDetailPage({ params }: Props) {
  const { id } = await params;
  const notice = await getNoticeById(id);

  if (!notice) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[800px] px-3 py-4">
      <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
        <Link href="/" prefetch={false} className="hover:text-red-600">
          홈
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/board/notice" prefetch={false} className="hover:text-red-600">
          공지사항
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-gray-800">{notice.title}</span>
      </div>
      <div className="rounded border border-gray-200 bg-white p-5">
        <div className="mb-4 border-b border-gray-200 pb-3">
          {notice.isPinned ? (
            <span className="mb-2 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
              고정 공지
            </span>
          ) : null}
          <h1 className="mt-1 text-lg font-black text-gray-800">{notice.title}</h1>
          <p className="mt-1 text-xs text-gray-400">{formatDate(notice.createdAt)}</p>
        </div>
        <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{notice.content}</div>
      </div>
      <div className="mt-3 text-center">
        <Link href="/board/notice" prefetch={false} className="text-sm text-gray-500 hover:text-red-600">
          목록으로
        </Link>
      </div>
    </div>
  );
}
