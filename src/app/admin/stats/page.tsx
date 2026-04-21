import type { Metadata } from 'next';
import { BarChart2, TrendingUp } from 'lucide-react';
import { getAdminStatsData } from '@/lib/server/admin-stats';

export const metadata: Metadata = { title: '통계 | 관리자' };

export const dynamic = 'force-dynamic';

export default async function AdminStatsPage() {
  const stats = await getAdminStatsData();
  const maxViewCount = stats.topShops[0]?.viewCount ?? 0;

  return (
    <div className="max-w-[1000px] space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
        <BarChart2 className="h-5 w-5 text-red-600" />
        통계 보고서
      </h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.summary.map((item) => (
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
          조회 많은 업소 TOP 5
        </h2>
        <div className="space-y-3">
          {stats.topShops.map((shop, index) => (
            <div key={shop.id} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-gray-400">{index + 1}</span>
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="font-bold text-gray-700">
                    {shop.name}
                    <span className="ml-1 font-normal text-gray-400">({shop.regionLabel})</span>
                  </span>
                  <span className="text-gray-500">{shop.viewCount.toLocaleString()}건</span>
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
          {stats.topShops.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">집계할 업소 데이터가 없습니다.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
