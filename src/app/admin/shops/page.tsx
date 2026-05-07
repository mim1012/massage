'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Crown, Edit2, Plus, Search, Store } from 'lucide-react';
import clsx from 'clsx';
import type { AdminShopListItem } from '@/lib/communityTypes';
import { REGIONS } from '@/lib/catalog';

export default function AdminShopsPage() {
  const [shops, setShops] = useState<AdminShopListItem[]>([]);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadShops();
  }, []);

  async function loadShops() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/shops', { cache: 'no-store' });
      const result = (await response.json()) as { shops?: AdminShopListItem[]; error?: string };
      if (!response.ok || !result.shops) {
        throw new Error(result.error ?? '업소 목록을 불러오지 못했습니다.');
      }

      setShops(result.shops);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '업소 목록을 불러오지 못했습니다.');
      console.error(loadError);
    } finally {
      setLoading(false);
    }
  }

  async function toggleVisibility(shop: AdminShopListItem) {
    setError(null);

    try {
      const response = await fetch(`/api/admin/shops/${shop.id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !shop.isVisible }),
      });
      const result = (await response.json()) as { shop?: AdminShopListItem; error?: string };
      if (!response.ok || !result.shop) {
        throw new Error(result.error ?? '업소 노출 상태를 변경하지 못했습니다.');
      }

      setShops((current) => current.map((item) => (item.id === shop.id ? result.shop! : item)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : '업소 노출 상태를 변경하지 못했습니다.');
      console.error(updateError);
    }
  }

  async function togglePremium(shop: AdminShopListItem) {
    setError(null);

    try {
      const response = await fetch(`/api/admin/shops/${shop.id}/premium`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPremium: !shop.isPremium,
          premiumOrder: !shop.isPremium ? shops.filter((item) => item.isPremium).length + 1 : undefined,
        }),
      });
      const result = (await response.json()) as { shop?: AdminShopListItem; error?: string };
      if (!response.ok || !result.shop) {
        throw new Error(result.error ?? '프리미엄 상태를 변경하지 못했습니다.');
      }

      await loadShops();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : '프리미엄 상태를 변경하지 못했습니다.');
      console.error(updateError);
    }
  }

  async function updatePremiumOrder(shop: AdminShopListItem, order: number) {
    if (shop.premiumOrder === order) return;
    setError(null);

    try {
      const response = await fetch(`/api/admin/shops/${shop.id}/premium`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPremium: true,
          premiumOrder: order,
        }),
      });
      if (!response.ok) throw new Error('순서 변경 실패');
      await loadShops();
    } catch (updateError) {
      setError('프리미엄 순서를 변경하지 못했습니다.');
      console.error(updateError);
    }
  }

  const filteredShops = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return shops.filter((shop) => {
      const matchesRegion = regionFilter === 'all' || shop.region === regionFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        shop.name.toLowerCase().includes(normalizedSearch) ||
        shop.phone.includes(normalizedSearch) ||
        `${shop.regionLabel} ${shop.subRegionLabel ?? ''} ${shop.themeLabel}`.toLowerCase().includes(normalizedSearch);

      return matchesRegion && matchesSearch;
    });
  }, [regionFilter, search, shops]);

  const hasActiveFilters = search.trim().length > 0 || regionFilter !== 'all';

  return (
    <div className="max-w-[1200px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <Store className="h-5 w-5 text-[#D4A373]" /> 업소 목록 관리
        </h1>
        <Link
          href="/admin/shops/new"
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
            placeholder="업소명, 지역, 전화번호 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded border border-gray-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-[#D4A373]"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(event) => setRegionFilter(event.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#D4A373]"
        >
          {REGIONS.map((region) => (
            <option key={region.code} value={region.code}>
              {region.label}
            </option>
          ))}
        </select>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

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
                <th className="w-28 px-4 py-2 text-center font-bold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading &&
                filteredShops.map((shop) => (
                  <tr key={shop.id} className="transition-colors hover:bg-gray-100">
                    <td data-label="노출" className="px-4 py-2 text-center">
                      <button
                        onClick={() => void toggleVisibility(shop)}
                        className={clsx('toggle-switch inline-block', shop.isVisible ? 'on' : 'off')}
                        title={shop.isVisible ? '노출 중 (클릭하여 숨김)' : '숨김 (클릭하여 노출)'}
                      >
                        <div className="toggle-knob" />
                      </button>
                      <span
                        className={clsx(
                          'mt-0.5 block text-[10px] font-bold',
                          shop.isVisible ? 'text-green-600' : 'text-gray-400',
                        )}
                      >
                        {shop.isVisible ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td data-label="AD" className="px-4 py-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => void togglePremium(shop)}
                          className={clsx(
                            'rounded p-1 text-white transition-colors',
                            shop.isPremium ? 'bg-amber-500' : 'bg-gray-300 hover:bg-gray-400',
                          )}
                          title={shop.isPremium ? 'AD 해제' : 'AD 등록'}
                        >
                          <Crown className="h-3.5 w-3.5" />
                        </button>
                        {shop.isPremium && (
                          <input
                            type="number"
                            defaultValue={shop.premiumOrder ?? 0}
                            onBlur={(e) => updatePremiumOrder(shop, parseInt(e.target.value))}
                            className="w-10 rounded border border-amber-200 bg-amber-50 text-center text-[10px] font-bold text-amber-700 outline-none focus:border-amber-500"
                            title="노출 순서 (낮을수록 먼저 노출)"
                          />
                        )}
                      </div>
                    </td>
                    <td data-label="업소명" className="px-4 py-2 font-bold text-gray-800">
                      <Link href={`/admin/shops/${shop.id}`} className="hover:text-[#D4A373] hover:underline">
                        {shop.name}
                      </Link>
                      {!shop.isVisible ? (
                        <span className="ml-2 rounded bg-gray-200 px-1 py-0.5 text-[10px] text-gray-500">숨김</span>
                      ) : null}
                    </td>
                    <td data-label="지역/테마" className="px-4 py-2 text-xs text-gray-500">
                      {shop.regionLabel}
                      {shop.subRegionLabel ? ` > ${shop.subRegionLabel}` : ''} / {shop.themeLabel}
                    </td>
                    <td data-label="연락처" className="px-4 py-2 text-xs text-gray-500">{shop.phone}</td>
                    <td data-label="관리" className="px-4 py-2 text-center whitespace-nowrap">
                      <Link
                        href={`/admin/shops/${shop.id}`}
                        className="inline-flex items-center gap-1 rounded border border-[#D4A373]/30 bg-white px-2 py-1 text-xs font-bold text-[#D4A373] shadow-sm hover:bg-[#FEFAE0]"
                      >
                        <Edit2 className="h-3 w-3" /> 버튼 수정
                      </Link>
                      <Link
                        href={`/admin/shops/${shop.id}`}
                        className="ml-1.5 inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                      >
                        상세입력
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {loading ? <div className="py-6 text-center text-sm text-gray-400">업소 목록을 불러오는 중입니다.</div> : null}
        {!loading && filteredShops.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">
            {shops.length === 0 && !hasActiveFilters
              ? '등록된 업소가 없습니다.'
              : '검색 조건에 맞는 업소가 없습니다.'}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const styles = `
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }

  .toggle-switch {
    position: relative;
    height: 20px;
    width: 34px;
    border-radius: 9999px;
    transition: background-color 0.2s ease;
  }

  .toggle-switch.on {
    background: #22c55e;
  }

  .toggle-switch.off {
    background: #d1d5db;
  }

  .toggle-knob {
    position: absolute;
    top: 2px;
    height: 16px;
    width: 16px;
    border-radius: 9999px;
    background: #fff;
    transition: all 0.2s ease;
  }

  .toggle-switch.on .toggle-knob {
    right: 2px;
  }

  .toggle-switch.off .toggle-knob {
    left: 2px;
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
