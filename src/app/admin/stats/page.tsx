import { Metadata } from 'next';
import { BarChart2, TrendingUp } from 'lucide-react';
import { getCachedAdminStatsData } from '@/lib/server/admin-stats';

export const metadata: Metadata = { title: '통계 | 관리자' };

export default async function AdminStatsPage() {
  const { summary, topShops } = await getCachedAdminStatsData();
  const maxViews = topShops[0]?.viewCount ?? 0;

  return (
    <div className="max-w-[1000px] space-y-4">
      <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-red-600" /> 통계 보고서
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map(item => (
          <div key={item.label} className="bg-white border border-gray-200 rounded p-4 text-center">
            <p className="text-[11px] text-gray-500 mb-1">{item.label}</p>
            <p className="text-2xl font-black text-gray-800">{item.value.toLocaleString()}</p>
            <p className={`text-[10px] mt-1 font-bold ${item.delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>{item.helperText}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-500" /> 인기 조회 업소 TOP 5
        </h2>
        <div className="space-y-3">
          {topShops.length === 0 && (
            <p className="text-xs text-center py-4 text-gray-400">아직 집계된 조회 데이터가 없습니다.</p>
          )}
          {topShops.map((shop, idx) => (
            <div key={shop.id} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-gray-400">{idx + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1 text-[11px]">
                  <span className="font-bold text-gray-700">{shop.name} <span className="font-normal text-gray-400 ml-1">({shop.regionLabel})</span></span>
                  <span className="text-gray-500">{shop.viewCount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${maxViews > 0 ? (shop.viewCount / maxViews) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
