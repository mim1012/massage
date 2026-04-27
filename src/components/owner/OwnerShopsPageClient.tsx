'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Edit2, Plus, Search, Store } from 'lucide-react';
import type { AdminShopListItem } from '@/lib/communityTypes';

export default function OwnerShopsPageClient({ initialShops }: { initialShops: AdminShopListItem[] }) {
  const [shops] = useState<AdminShopListItem[]>(initialShops);
  const [search, setSearch] = useState('');

  const filteredShops = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return shops.filter((shop) => {
      if (normalizedSearch.length === 0) {
        return true;
      }

      return (
        shop.name.toLowerCase().includes(normalizedSearch) ||
        shop.phone.toLowerCase().includes(normalizedSearch) ||
        `${shop.regionLabel} ${shop.subRegionLabel ?? ''} ${shop.themeLabel}`.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [search, shops]);

  return (
    <div className="max-w-[1100px] space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <Store className="h-5 w-5 text-red-600" />
          내 업소 관리
        </h1>
        <Link
          href="/owner/shops/new"
          className="flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          업소 등록
        </Link>
      </div>

      <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        오너 계정으로 연결된 업소만 표시됩니다. 노출 여부와 프리미엄 상태는 관리자 승인 후 반영됩니다.
      </div>

      <div className="relative rounded border border-gray-200 bg-white p-3">
        <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="업소명, 지역, 테마, 연락처 검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded border border-gray-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-red-500"
        />
      </div>

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2 font-bold">업소명</th>
              <th className="px-4 py-2 font-bold">지역 / 테마</th>
              <th className="px-4 py-2 font-bold">연락처</th>
              <th className="px-4 py-2 font-bold">상태</th>
              <th className="w-24 px-4 py-2 text-center font-bold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredShops.map((shop) => (
              <tr key={shop.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-bold text-gray-800">{shop.name}</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {shop.regionLabel}
                  {shop.subRegionLabel ? ` > ${shop.subRegionLabel}` : ''}
                  {' / '}
                  {shop.themeLabel}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">{shop.phone}</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    <span className={`rounded px-1.5 py-0.5 font-bold ${shop.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {shop.isVisible ? '노출중' : '검수중'}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 font-bold ${shop.isPremium ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {shop.isPremium ? '프리미엄' : '일반'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <Link
                    href={`/owner/shops/${shop.id}`}
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
        {filteredShops.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">
            {shops.length === 0
              ? '아직 등록된 내 업소가 없습니다. 우측 상단의 업소 등록으로 첫 업소를 추가해 주세요.'
              : '검색 조건에 맞는 업소가 없습니다. 검색어를 지우거나 다른 키워드로 다시 찾아보세요.'}
          </div>
        ) : null}
      </div>
    </div>
  );
}
