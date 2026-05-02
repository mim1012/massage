import type { Metadata } from 'next';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/guards';
import { getBoardLandingData } from '@/lib/server/communityStore';
import type { Notice, QnA, Review } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: '게시판',
  description: '공지사항, Q&A, 업소 후기',
};

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const currentUser = await getSessionUser();
  const { summary, notices, qnaEntries, reviews } = await getBoardLandingData({
    includeReviews: Boolean(currentUser),
    viewer: currentUser ? { id: currentUser.id, role: currentUser.role } : undefined,
  });

  return (
    <div className="mx-auto max-w-[1000px] px-3 py-4">
      <h1 className="mb-4 text-lg font-black text-gray-800">📋 고객센터 &amp; 게시판</h1>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { href: '/board/notice', label: '공지사항', count: summary.notices, emoji: '📢' },
          { href: '/board/qna', label: 'Q&A', count: summary.qna, emoji: '💬' },
          { href: '/board/review', label: '업소 후기', count: summary.reviews, emoji: '⭐' },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            className="rounded border border-gray-200 bg-white p-3 text-center transition-all hover:border-red-300 hover:bg-red-50/50"
          >
            <div className="mb-1 text-2xl">{tab.emoji}</div>
            <p className="text-sm font-bold text-gray-800">{tab.label}</p>
            <p className="text-xs text-gray-400">{tab.count}개</p>
          </Link>
        ))}
      </div>

      <div className="mb-3 rounded border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2">
          <h2 className="text-sm font-black text-gray-800">📢 공지사항</h2>
          <Link href="/board/notice" prefetch={false} className="text-xs text-red-600 hover:underline">
            전체 &raquo;
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {notices.map((notice: Notice) => (
            <Link
              key={notice.id}
              href={`/board/notice/${notice.id}`}
              prefetch={false}
              className="-mx-1 flex items-center justify-between rounded px-1 py-2 transition-all hover:bg-gray-50"
            >
              <div className="flex min-w-0 items-center gap-2">
                {notice.isPinned ? (
                  <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                    공지
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
          <h2 className="text-sm font-black text-gray-800">💬 Q&amp;A</h2>
          <Link href="/board/qna" prefetch={false} className="text-xs text-red-600 hover:underline">
            전체 &raquo;
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {qnaEntries.slice(0, 3).map((entry: QnA) => (
            <div key={entry.id} className="py-2.5">
              <div className="mb-1 flex items-start gap-2">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    entry.isAnswered ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {entry.isAnswered ? '완료' : '대기'}
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
          <h2 className="text-sm font-black text-gray-800">⭐ 최근 후기</h2>
          <Link href="/board/review" prefetch={false} className="text-xs text-red-600 hover:underline">
            전체 &raquo;
          </Link>
        </div>
        {!currentUser ? (
          <div className="rounded border border-gray-100 bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
            후기는 로그인한 회원만 확인할 수 있습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.slice(0, 3).map((review: Review) => (
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
            {reviews.length === 0 ? <div className="py-6 text-center text-sm text-gray-400">등록된 후기가 없습니다.</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}
