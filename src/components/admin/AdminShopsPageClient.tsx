'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit2, Crown, Store, RefreshCw } from 'lucide-react';
import type { AdminShopListItem, AdminShopPageResult } from '@/lib/communityTypes';
import { REGIONS, REGION_MAP } from '@/lib/types';

import PaginationControls from '@/components/public/PaginationControls';
import clsx from 'clsx';

const SHOPS_PAGE_SIZE = 20;

export default function AdminShopsPageClient({ initialData }: { initialData: AdminShopPageResult }) {
  const [shops, setShops] = useState<AdminShopListItem[]>(initialData.shops);
  const [total, setTotal] = useState(initialData.total);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [page, setPage] = useState(initialData.page);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const pendingRef = useRef<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const requestSeq = useRef(0);
  const skipNextLoad = useRef(true);

function getActionErrorMessage(result: unknown, fallback: string) {
  if (result && typeof result === 'object' && 'error' in result && typeof result.error === 'string') {
    return result.error;
  }

  return fallback;
}

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadShops = useCallback(async () => {
    const requestId = requestSeq.current + 1;
    requestSeq.current = requestId;
    setIsLoading(true);
    setActionError(null);

    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(SHOPS_PAGE_SIZE) });
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (regionFilter !== 'all') params.set('region', REGION_MAP[regionFilter] ?? regionFilter);

      const res = await fetch(`/api/admin/shops?${params.toString()}`, { cache: 'no-store', credentials: 'same-origin' });
      const payload = (await res.json()) as AdminShopPageResult & { error?: string };

      if (requestSeq.current !== requestId) {
        return;
      }
      if (!res.ok) {
        throw new Error(payload.error ?? '업소 목록을 불러오지 못했습니다.');
      }

      setShops(payload.shops ?? []);
      setTotal(payload.total ?? 0);
      setTotalPages(payload.totalPages ?? 1);
    } catch (caughtError) {
      if (requestSeq.current !== requestId) {
        return;
      }

      setActionError(caughtError instanceof Error ? caughtError.message : '업소 목록을 불러오지 못했습니다.');
    } finally {
      if (requestSeq.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [page, debouncedSearch, regionFilter]);

  useEffect(() => {
    if (skipNextLoad.current) {
      skipNextLoad.current = false;
      return;
    }

    void loadShops();
  }, [loadShops]);

  const toggleVisibility = async (id: string) => {
    if (pendingRef.current.has(id)) return;
    const shop = shops.find((entry) => entry.id === id);
    if (!shop) return;
    pendingRef.current.add(id);
    setPendingIds(new Set(pendingRef.current));
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/shops/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !shop.isVisible }),
      });
      const result = (await res.json().catch(() => ({}))) as { shop?: AdminShopListItem; error?: string };
      if (!res.ok || !result.shop) {
        setActionError(getActionErrorMessage(result, '노출 상태 변경에 실패했습니다.'));
        return;
      }

      setShops((prev) => prev.map((entry) => (entry.id === id ? { ...entry, isVisible: result.shop?.isVisible ?? !entry.isVisible } : entry)));
    } catch {
      setActionError('노출 상태 변경에 실패했습니다.');
    } finally {
      pendingRef.current.delete(id);
      setPendingIds(new Set(pendingRef.current));
    }
  };

  const togglePremium = async (id: string) => {
    if (pendingRef.current.has(id)) return;
    const shop = shops.find((entry) => entry.id === id);
    if (!shop) return;
    pendingRef.current.add(id);
    setPendingIds(new Set(pendingRef.current));
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/shops/${id}/premium`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: !shop.isPremium }),
      });
      const result = (await res.json().catch(() => ({}))) as { shop?: AdminShopListItem; error?: string };
      if (!res.ok || !result.shop) {
        setActionError(getActionErrorMessage(result, 'AD 상태 변경에 실패했습니다.'));
        return;
      }

      setShops((prev) => prev.map((entry) => (entry.id === id ? { ...entry, isPremium: result.shop?.isPremium ?? !entry.isPremium, premiumOrder: result.shop?.premiumOrder } : entry)));
    } catch {
      setActionError('AD 상태 변경에 실패했습니다.');
    } finally {
      pendingRef.current.delete(id);
      setPendingIds(new Set(pendingRef.current));
    }
  };

  return (
    <div className="max-w-[1200px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <Store className="h-5 w-5 text-[#D4A373]" /> 업소 목록 관리
        </h1>
        <Link
          href="/admin/shops/new"
          prefetch={false}
          className="flex items-center gap-1 rounded bg-[#D4A373] px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-[#C29262]"
        >
          <Plus className="h-4 w-4" /> 업소 등록
        </Link>
      </div>

      <div className="flex flex-col gap-2 rounded border border-gray-200 bg-white p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="업소명, 연락처 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded border border-gray-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-[#D4A373]"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(event) => { setRegionFilter(event.target.value); setPage(1); }}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#D4A373]"
        >
          {REGIONS.map((region) => (
            <option key={region.code} value={region.code}>
              {region.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-gray-500">
        <span>총 {total.toLocaleString()}개</span>
        {isLoading ? <span className="inline-flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> 불러오는 중...</span> : <span>페이지당 {SHOPS_PAGE_SIZE}개</span>}
      </div>

      {actionError ? (
        <div className="rounded border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="table-wrap overflow-hidden rounded border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="table-responsive w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="w-16 px-4 py-2 text-center font-bold">노출</th>
                <th className="w-12 px-4 py-2 text-center font-bold">AD</th>
                <th className="px-4 py-2 font-bold">업소명</th>
                <th className="px-4 py-2 font-bold">지역/테마</th>
                <th className="px-4 py-2 font-bold">연락처</th>
                <th className="w-20 px-4 py-2 text-center font-bold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shops.map((shop) => (
                <tr key={shop.id} className="transition-colors hover:bg-gray-100">
                  <td data-label="노출" className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(shop.id)}
                      aria-pressed={shop.isVisible}
                      aria-label={shop.isVisible ? `${shop.name} 노출 끄기` : `${shop.name} 노출 켜기`}
                      disabled={pendingIds.has(shop.id)}
                      className={clsx(
                        'toggle-switch inline-block',
                        shop.isVisible ? 'on' : 'off',
                        pendingIds.has(shop.id) && 'cursor-not-allowed opacity-50',
                      )}
                      title={shop.isVisible ? '노출 중 (클릭하여 숨김)' : '숨김 (클릭하여 노출)'}
                    >
                      <div className="toggle-knob" />
                    </button>
                    <span className={clsx('mt-0.5 block text-[10px] font-bold', shop.isVisible ? 'text-green-600' : 'text-gray-400')}>
                      {shop.isVisible ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td data-label="AD" className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => togglePremium(shop.id)}
                      aria-pressed={shop.isPremium}
                      aria-label={shop.isPremium ? `${shop.name} AD 해제` : `${shop.name} AD 등록`}
                      disabled={pendingIds.has(shop.id)}
                      className={clsx(
                        'rounded p-1 text-white transition-colors',
                        shop.isPremium ? 'bg-amber-500' : 'bg-gray-300',
                        !pendingIds.has(shop.id) && !shop.isPremium && 'hover:bg-gray-400',
                        pendingIds.has(shop.id) && 'cursor-not-allowed opacity-50',
                      )}
                      title={shop.isPremium ? 'AD 해제' : 'AD 등록'}
                    >
                      <Crown className="h-3.5 w-3.5" />
                    </button>
                  </td>
                  <td data-label="업소명" className="px-4 py-2 font-bold text-gray-800">
                    <Link href={`/admin/shops/${shop.id}`} prefetch={false} className="hover:text-[#D4A373] hover:underline">
                      {shop.name}
                    </Link>
                    {!shop.isVisible ? <span className="ml-2 rounded bg-gray-200 px-1 py-0.5 text-[10px] text-gray-500">숨김</span> : null}
                  </td>
                  <td data-label="지역/테마" className="px-4 py-2 text-xs text-gray-500">
                    {shop.regionLabel} {shop.subRegionLabel ? `> ${shop.subRegionLabel}` : ''} / {shop.themeLabel}
                  </td>
                  <td data-label="연락처" className="px-4 py-2 text-xs text-gray-500">
                    {shop.phone}
                  </td>
                  <td data-label="관리" className="px-4 py-2 text-center whitespace-nowrap">
                    <Link
                      href={`/admin/shops/${shop.id}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1 rounded border border-[#D4A373]/30 bg-white px-2 py-1 text-xs font-bold text-[#D4A373] shadow-sm hover:bg-[#FEFAE0]"
                    >
                      <Edit2 className="h-3 w-3" /> 수정
                    </Link>
                    <Link
                      href={`/admin/shops/${shop.id}`}
                      prefetch={false}
                      className="ml-1.5 inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                    >
                      상세입력
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && shops.length === 0 ? <div className="py-6 text-center text-sm text-gray-400">목록이 없습니다.</div> : null}
        </div>
      </div>

      <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />

    </div>
  );
}

const styles = `
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }

  .table td {
    word-break: keep-all;
  }

  @media (max-width: 768px) {
    .table-responsive thead {
      display: none;
    }

    .table-responsive,
    .table-responsive tbody,
    .table-responsive tr,
    .table-responsive td {
      display: block;
      width: 100%;
    }

    .table-responsive tr {
      background: #fff;
      border-radius: 10px;
      margin-bottom: 12px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border: 1px solid #f0f0f0;
    }

    .table-responsive td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      font-size: 13px;
      white-space: normal;
      border-bottom: 1px solid #f9fafb;
      text-align: right;
    }

    .table-responsive td:last-child {
      border-bottom: none;
    }

    .table-responsive td::before {
      content: attr(data-label);
      font-weight: 600;
      color: #888;
      width: 80px;
      text-align: left;
      flex-shrink: 0;
    }
  }
`;

if (typeof document !== 'undefined') {
  const styleId = 'shop-admin-styles';
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
  }
}
