import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, BarChart2, MessageCircle, Star, Store, TrendingUp } from 'lucide-react';
import { getAdminDashboardData } from '@/lib/server/communityStore';
import type { AdminDashboardData } from '@/lib/communityTypes';

export const metadata: Metadata = {
  title: '관리자 대시보드',
};

export const dynamic = 'force-dynamic';

const summaryCards = [
  { label: '전체 업소', icon: Store, colors: 'text-blue-600 bg-blue-50' },
  { label: '프리미엄 업소', icon: Star, colors: 'text-amber-500 bg-amber-50' },
  { label: '미답변 Q&A', icon: MessageCircle, colors: 'text-red-500 bg-red-50' },
  { label: '공지 수', icon: BarChart2, colors: 'text-green-600 bg-green-50' },
] as const;

export default async function AdminDashboardPage() {
  const dashboard: AdminDashboardData = await getAdminDashboardData();

  return (
    <div className="max-w-[1000px] space-y-4">
      <h1 className="text-xl font-black text-gray-800">대시보드</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {dashboard.summary.map((item, index) => {
          const card = summaryCards[index] ?? summaryCards[0];
          const Icon = card.icon;
          const [iconColor, backgroundColor] = card.colors.split(' ');

          return (
            <div
              key={`${card.label}-${index}`}
              className="flex items-center justify-between rounded border border-gray-200 bg-white p-4"
            >
              <div>
                <p className="mb-1 text-[11px] text-gray-500">{card.label}</p>
                <p className="text-xl font-black text-gray-800">{item.value}</p>
              </div>
              <div className={`rounded p-2 ${backgroundColor}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="rounded border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
              <AlertCircle className="h-4 w-4 text-red-500" />
              처리 필요 Q&amp;A
            </h2>
            <Link href="/admin/qna" className="text-[10px] text-gray-400 hover:text-red-600">
              전체 보기
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboard.pendingQna.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                <span className="min-w-0 truncate pr-3 text-gray-700">{item.question}</span>
                <Link href="/admin/qna" className="shrink-0 rounded bg-red-50 px-2 py-1 text-[11px] text-red-600">
                  답변하기
                </Link>
              </div>
            ))}
            {dashboard.pendingQna.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">대기 중인 문의가 없습니다.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              최근 등록 리뷰
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboard.recentReviews.map((review) => (
              <div key={review.id} className="py-2 text-sm">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-800">{review.shopName}</span>
                  <div className="flex items-center text-[10px] font-bold text-amber-500">
                    <Star className="mr-0.5 h-2.5 w-2.5 fill-amber-500" />
                    {review.rating.toFixed(1)}
                  </div>
                </div>
                <p className="truncate text-xs text-gray-600">{review.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
