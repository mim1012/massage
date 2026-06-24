'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart2, RefreshCw, TrendingUp } from 'lucide-react';
import type { AdminStatsData } from '@/lib/server/admin-stats';

type AdminStatsPageClientProps = {
  initialStats: AdminStatsData;
};

const EMPTY_STATS: AdminStatsData = {
  summary: [
    { label: '오늘 방문자', value: 0, helperText: '전일 대비 +0%', delta: 0 },
    { label: '이번 달 방문자', value: 0, helperText: '전월 대비 +0%', delta: 0 },
    { label: '총 페이지뷰', value: 0, helperText: '전월 대비 +0%', delta: 0 },
    { label: '오늘 회원가입', value: 0, helperText: '전일 대비 +0%', delta: 0 },
  ],
  topShops: [],
};

export default function AdminStatsPageClient({ initialStats }: AdminStatsPageClientProps) {
  const [stats, setStats] = useState<AdminStatsData>(initialStats);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxViews = useMemo(() => stats.topShops[0]?.viewCount ?? 0, [stats.topShops]);

  const loadStats = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const payload = (await response.json()) as AdminStatsData & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? '통계 데이터를 불러오지 못했습니다.');
      }

      setStats(payload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '통계 데이터를 불러오지 못했습니다.');
      if (!stats.summary.length) {
        setStats(EMPTY_STATS);
      }
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    void loadStats({ silent: true });
    // Initial SSR data renders immediately; this background API sync verifies auth/session freshness.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-[1000px] space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <BarChart2 className="h-5 w-5 text-red-600" /> 통계 보고서
        </h1>
        <button
          type="button"
          onClick={() => void loadStats()}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {error ? (
        <div className="rounded border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.summary.map((item) => (
          <div key={item.label} className="rounded border border-gray-200 bg-white p-4 text-center">
            <p className="mb-1 text-[11px] text-gray-500">{item.label}</p>
            <p className="text-2xl font-black text-gray-800">{item.value.toLocaleString()}</p>
            <p className={`mt-1 text-[10px] font-bold ${item.delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {item.helperText}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-2 text-sm font-bold text-gray-800">
          <TrendingUp className="h-4 w-4 text-blue-500" /> 인기 조회 업소 TOP 5
        </h2>
        <div className="space-y-3">
          {stats.topShops.length === 0 && (
            <p className="py-4 text-center text-xs text-gray-400">아직 집계된 조회 데이터가 없습니다.</p>
          )}
          {stats.topShops.map((shop, idx) => (
            <div key={shop.id} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-gray-400">{idx + 1}</span>
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="font-bold text-gray-700">
                    {shop.name} <span className="ml-1 font-normal text-gray-400">({shop.regionLabel})</span>
                  </span>
                  <span className="text-gray-500">{shop.viewCount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${maxViews > 0 ? (shop.viewCount / maxViews) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
