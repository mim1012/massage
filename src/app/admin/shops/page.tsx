'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Crown, Edit2, Plus, Search, Store } from 'lucide-react';
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

  const filteredShops = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return shops.filter((shop) => {
      const matchesRegion = regionFilter === 'all' || shop.region === regionFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        shop.name.toLowerCase().includes(normalizedSearch) ||
        shop.phone.includes(normalizedSearch) ||
        `${shop.regionLabel} ${shop.subRegionLabel ?? ''}`.toLowerCase().includes(normalizedSearch);

      return matchesRegion && matchesSearch;
    });
  }, [regionFilter, search, shops]);

  return (
    <div className="max-w-[1200px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <Store className="h-5 w-5 text-red-600" />
          업소 관리
        </h1>
        <Link
          href="/admin/shops/new"
          className="flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          업소 등록
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
            className="w-full rounded border border-gray-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-red-500"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(event) => setRegionFilter(event.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-500"
        >
          {REGIONS.map((region) => (
            <option key={region.code} value={region.code}>
              {region.label}
            </option>
          ))}
        </select>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="w-12 px-4 py-2 text-center font-bold">노출</th>
              <th className="w-12 px-4 py-2 text-center font-bold">AD</th>
              <th className="px-4 py-2 font-bold">업소명</th>
              <th className="px-4 py-2 font-bold">지역 / 테마</th>
              <th className="px-4 py-2 font-bold">연락처</th>
              <th className="w-20 px-4 py-2 text-center font-bold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading &&
              filteredShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => void toggleVisibility(shop)}
                      className={`relative h-5 w-8 rounded-full transition-colors ${
                        shop.isVisible ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                          shop.isVisible ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => void togglePremium(shop)}
                      className={`rounded p-1 text-white transition-colors ${
                        shop.isPremium ? 'bg-amber-500' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    >
                      <Crown className="h-3.5 w-3.5" />
                    </button>
                  </td>
                  <td className="px-4 py-2 font-bold text-gray-800">
                    <Link href={`/admin/shops/${shop.id}`} className="hover:text-red-600 hover:underline">
                      {shop.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {shop.regionLabel}
                    {shop.subRegionLabel ? ` > ${shop.subRegionLabel}` : ''}
                    {' / '}
                    {shop.themeLabel}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{shop.phone}</td>
                  <td className="px-4 py-2 text-center">
                    <Link
                      href={`/admin/shops/${shop.id}`}
                      className="inline-flex items-center gap-1 rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                    >
                      <Edit2 className="h-3 w-3" />
                      수정
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {loading ? <div className="py-6 text-center text-sm text-gray-400">업소 목록을 불러오는 중입니다.</div> : null}
        {!loading && filteredShops.length === 0 ? <div className="py-6 text-center text-sm text-gray-400">목록이 없습니다.</div> : null}
      </div>
    </div>
  );
}
