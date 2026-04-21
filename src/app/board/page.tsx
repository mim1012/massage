import type { Metadata } from 'next';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { getBoardSummary, listNotices, listQna, listReviews } from '@/lib/server/communityStore';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: '커뮤니티',
  description: '공지사항, 문의답변, 후기, 제휴 문의를 확인할 수 있습니다.',
};

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const [summary, notices, qnaEntries, reviews] = await Promise.all([
    getBoardSummary(),
    listNotices(),
    listQna(),
    listReviews(3),
  ]);

  return (
    <div className="mx-auto max-w-[1000px] px-3 py-4">
      <h1 className="mb-4 text-lg font-black text-gray-800">커뮤니티</h1>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { href: '/board/notice', label: '공지사항', count: summary.notices, badge: 'N' },
          { href: '/board/qna', label: '문의답변', count: summary.qna, badge: 'Q' },
          { href: '/board/review', label: '후기', count: summary.reviews, badge: 'R' },
          { href: '/board/partnership', label: '제휴문의', count: 0, badge: 'P' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded border border-gray-200 bg-white p-3 text-center transition-all hover:border-red-300 hover:bg-red-50/50"
          >
            <div className="mb-1 text-2xl font-black text-red-500">{item.badge}</div>
            <p className="text-sm font-bold text-gray-800">{item.label}</p>
            <p className="text-xs text-gray-400">{item.count}건</p>
          </Link>
        ))}
      </div>

      <div className="mb-3 rounded border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2">
          <h2 className="text-sm font-black text-gray-800">공지사항</h2>
          <Link href="/board/notice" className="text-xs text-red-600 hover:underline">
            전체보기
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {notices.map((notice) => (
            <Link
              key={notice.id}
              href={`/board/notice/${notice.id}`}
              className="mx-[-4px] flex items-center justify-between rounded px-1 py-2 transition-all hover:bg-gray-50"
            >
              <div className="flex min-w-0 items-center gap-2">
                {notice.isPinned ? (
                  <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                    고정
                  </span>
                ) : null}
                <span className="truncate text-sm text-gray-700">{notice.title}</span>
              </div>
              <span className="ml-2 shrink-0 text-[11px] text-gray-400">{formatDate(notice.createdAt)}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-3 rounded border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2">
          <h2 className="text-sm font-black text-gray-800">문의답변</h2>
          <Link href="/board/qna" className="text-xs text-red-600 hover:underline">
            전체보기
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {qnaEntries.slice(0, 3).map((entry) => (
            <div key={entry.id} className="py-2.5">
              <div className="mb-1 flex items-start gap-2">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    entry.isAnswered ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {entry.isAnswered ? '답변완료' : '대기중'}
                </span>
                <p className="text-sm text-gray-700">Q. {entry.question}</p>
              </div>
              {entry.answer ? (
                <p className="ml-3 border-l-2 border-red-200 pl-10 text-xs text-gray-500">A. {entry.answer}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2">
          <h2 className="text-sm font-black text-gray-800">최근 후기</h2>
          <Link href="/board/review" className="text-xs text-red-600 hover:underline">
            전체보기
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {reviews.map((review) => (
            <div key={review.id} className="py-2.5">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{review.authorName}</span>
                  <span className="text-xs text-red-500">{review.shopName}</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <Star
                      key={score}
                      className={`h-3 w-3 ${score <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-gray-600">{review.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
