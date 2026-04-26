import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, AlertTriangle, BarChart2, MessageCircle, Star, Store, TrendingUp } from 'lucide-react';
import { getAdminDashboardData } from '@/lib/server/communityStore';
import type { AdminDashboardData } from '@/lib/communityTypes';

export const metadata: Metadata = {
  title: '대시보드 | 관리자',
};

export const dynamic = 'force-dynamic';

const summaryCards = [
  { label: '전체 업소', icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: '프리미엄(AD)', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  { label: '미답변 Q&A', icon: MessageCircle, color: 'text-[#D4A373]', bg: 'bg-[#FEFAE0]' },
  { label: '오늘 페이지뷰', icon: BarChart2, color: 'text-green-600', bg: 'bg-green-50' },
] as const;

export default async function AdminDashboardPage() {
  let dashboard: AdminDashboardData | null = null;
  let loadError = false;

  try {
    dashboard = await getAdminDashboardData();
  } catch (error) {
    loadError = true;
    console.error('Failed to load admin dashboard data', error);
  }

  return (
    <div className="max-w-[1000px] space-y-4">
      <h1 className="text-xl font-black text-gray-800">대시보드</h1>

      {loadError ? (
        <div className="flex items-start gap-3 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">대시보드 데이터를 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs text-amber-700">DB 연결 상태를 확인한 뒤 다시 시도해 주세요.</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(dashboard?.summary ?? []).map((item, index) => {
          const card = summaryCards[index] ?? summaryCards[0];
          const Icon = card.icon;

          return (
            <div
              key={`${card.label}-${index}`}
              className="flex items-center justify-between rounded border border-gray-200 bg-white p-4"
            >
              <div>
                <p className="mb-1 text-[11px] text-gray-500">{card.label}</p>
                <p className="text-xl font-black text-gray-800">{item.value}</p>
              </div>
              <div className={`rounded p-2 ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="rounded border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
              <AlertCircle className="h-4 w-4 text-[#D4A373]" /> 처리 필요 Q&amp;A
            </h2>
            <Link href="/admin/qna" className="text-[10px] text-gray-400 hover:text-[#D4A373]">
              더보기
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {(dashboard?.pendingQna ?? []).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                <span className="min-w-0 truncate pr-3 text-gray-700">{item.question}</span>
                <Link href="/admin/qna" className="shrink-0 rounded bg-[#FEFAE0] px-2 py-1 text-[11px] text-[#D4A373]">
                  답변하기
                </Link>
              </div>
            ))}
            {!loadError && (dashboard?.pendingQna?.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">새로운 문의가 없습니다.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
              <TrendingUp className="h-4 w-4 text-blue-500" /> 최근 작성된 후기
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {(dashboard?.recentReviews ?? []).map((review) => (
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
            {!loadError && (dashboard?.recentReviews?.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">최근 등록된 후기가 없습니다.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
