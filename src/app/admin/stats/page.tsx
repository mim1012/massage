import type { Metadata } from 'next';
import { AlertTriangle, BarChart2, TrendingUp } from 'lucide-react';
import { getAdminStatsData } from '@/lib/server/admin-stats';

export const metadata: Metadata = { title: '통계 | 관리자' };

export const dynamic = 'force-dynamic';

export default async function AdminStatsPage() {
  let stats: Awaited<ReturnType<typeof getAdminStatsData>> | null = null;
  let loadError = false;

  try {
    stats = await getAdminStatsData();
  } catch (error) {
    loadError = true;
    console.error('Failed to load admin stats', error);
  }

  const maxViewCount = stats?.topShops[0]?.viewCount ?? 0;

  return (
    <div className="max-w-[1000px] space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
        <BarChart2 className="h-5 w-5 text-red-600" />
        통계 보고서
      </h1>

      {loadError ? (
        <div className="flex items-start gap-3 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">통계 데이터를 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs text-amber-700">page_view_events 테이블과 집계 로직을 다시 확인해 주세요.</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(stats?.summary ?? []).map((item) => (
          <div key={item.label} className="rounded border border-gray-200 bg-white p-4 text-center">
            <p className="mb-1 text-[11px] text-gray-500">{item.label}</p>
            <p className="text-2xl font-black text-gray-800">{item.value.toLocaleString()}</p>
            <p className="mt-1 text-[10px] font-bold text-blue-500">{item.helperText}</p>
          </div>
        ))}
      </div>

      <div className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-2 text-sm font-bold text-gray-800">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          인기 조회 업소 TOP 5
        </h2>
        <div className="space-y-3">
          {(stats?.topShops ?? []).map((shop, index) => (
            <div key={shop.id} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-gray-400">{index + 1}</span>
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="font-bold text-gray-700">
                    {shop.name}
                    <span className="ml-1 font-normal text-gray-400">({shop.regionLabel})</span>
                  </span>
                  <span className="text-gray-500">{shop.viewCount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${maxViewCount > 0 ? (shop.viewCount / maxViewCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {!loadError && (stats?.topShops?.length ?? 0) === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">표시할 업소 통계가 없습니다.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
