import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, BarChart2, MessageCircle, Star, Store, TrendingUp } from 'lucide-react';
import { getAdminDashboardData } from '@/lib/server/communityStore';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

export const dynamic = 'force-dynamic';

const iconMap = {
  '전체 업소': Store,
  '프리미엄 업소': Star,
  '미답변 Q&A': MessageCircle,
  '공지 수': BarChart2,
} as const;

const colorMap = {
  '전체 업소': 'text-blue-600 bg-blue-50',
  '프리미엄 업소': 'text-amber-500 bg-amber-50',
  '미답변 Q&A': 'text-red-500 bg-red-50',
  '공지 수': 'text-green-600 bg-green-50',
} as const;

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <div className="max-w-[1000px] space-y-4">
      <h1 className="text-xl font-black text-gray-800">대시보드</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {dashboard.summary.map((item) => {
          const Icon = iconMap[item.label as keyof typeof iconMap];
          const [iconColor, backgroundColor] = colorMap[item.label as keyof typeof colorMap].split(' ');

          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded border border-gray-200 bg-white p-4"
            >
              <div>
                <p className="mb-1 text-[11px] text-gray-500">{item.label}</p>
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
              처리 필요한 Q&amp;A
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
            {dashboard.pendingQna.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">대기 중인 문의가 없습니다.</p>
            )}
          </div>
        </section>

        <section className="rounded border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              최근 등록 후기
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
