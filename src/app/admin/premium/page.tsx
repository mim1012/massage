'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Crown, Info, Save } from 'lucide-react';
import type { AdminShopListItem, PremiumBoardData } from '@/lib/communityTypes';

export default function AdminPremiumPage() {
  const [premiumShops, setPremiumShops] = useState<AdminShopListItem[]>([]);
  const [availableShops, setAvailableShops] = useState<AdminShopListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadPremiumBoard();
  }, []);

  async function loadPremiumBoard() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/premium', { cache: 'no-store' });
      const result = (await response.json()) as PremiumBoardData & { error?: string };
      if (!response.ok || !('premiumShops' in result) || !('availableShops' in result)) {
        throw new Error(result.error ?? '프리미엄 배너 목록을 불러오지 못했습니다.');
      }

      setPremiumShops(result.premiumShops);
      setAvailableShops(result.availableShops);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '프리미엄 배너 목록을 불러오지 못했습니다.');
      console.error(loadError);
    } finally {
      setLoading(false);
    }
  }

  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= premiumShops.length) {
      return;
    }

    const next = [...premiumShops];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setPremiumShops(next);
  }

  function removePremium(id: string) {
    const removed = premiumShops.find((shop) => shop.id === id);
    if (!removed) {
      return;
    }

    setPremiumShops((current) => current.filter((shop) => shop.id !== id));
    setAvailableShops((current) =>
      [...current, { ...removed, isPremium: false, premiumOrder: undefined }].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    );
  }

  function addPremium(id: string) {
    const selected = availableShops.find((shop) => shop.id === id);
    if (!selected) {
      return;
    }

    setAvailableShops((current) => current.filter((shop) => shop.id !== id));
    setPremiumShops((current) => [...current, { ...selected, isPremium: true, premiumOrder: current.length + 1 }]);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/premium', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: premiumShops.map((shop) => shop.id) }),
      });
      const result = (await response.json()) as PremiumBoardData & { error?: string };
      if (!response.ok || !('premiumShops' in result) || !('availableShops' in result)) {
        throw new Error(result.error ?? '프리미엄 순서를 저장하지 못했습니다.');
      }

      setPremiumShops(result.premiumShops);
      setAvailableShops(result.availableShops);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '프리미엄 순서를 저장하지 못했습니다.');
      console.error(saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[700px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <Crown className="h-5 w-5 text-amber-500" />
          프리미엄 배너 관리
        </h1>
        <button
          onClick={() => void handleSave()}
          disabled={saving || loading}
          className="flex items-center gap-1 rounded bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? '저장 중' : '저장'}
        </button>
      </div>

      <div className="flex items-start gap-1.5 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>메인 화면 상단에 노출되는 프리미엄 업소의 순서를 관리합니다. 저장 후 실제 노출 순서에 반영됩니다.</p>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

      <div className="rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5">
          <span className="text-xs font-bold text-gray-600">현재 적용 배너 ({premiumShops.length})</span>
        </div>
        {loading ? (
          <div className="py-6 text-center text-sm text-gray-400">프리미엄 목록을 불러오는 중입니다.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {premiumShops.map((shop, index) => (
              <div key={shop.id} className="flex items-center gap-3 p-3">
                <div className="shrink-0">
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="rounded p-0.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <div className="w-5 rounded bg-amber-50 text-center text-[10px] font-bold text-amber-500">
                    {index + 1}
                  </div>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === premiumShops.length - 1}
                    className="rounded p-0.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold text-gray-800">{shop.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {shop.regionLabel}
                    {shop.subRegionLabel ? ` / ${shop.subRegionLabel}` : ''}
                    {' / '}
                    {shop.themeLabel}
                  </p>
                </div>
                <button
                  onClick={() => removePremium(shop.id)}
                  className="shrink-0 rounded border border-gray-300 bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600 hover:bg-gray-200"
                >
                  제거
                </button>
              </div>
            ))}
            {premiumShops.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">선택된 프리미엄 업소가 없습니다.</div>
            ) : null}
          </div>
        )}
      </div>

      <div className="rounded border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
          <span className="text-xs font-bold text-gray-600">일반 업소 목록</span>
        </div>
        <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
          {availableShops.map((shop) => (
            <div key={shop.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
              <div>
                <span className="font-semibold text-gray-800">{shop.name}</span>
                <span className="ml-2 text-[11px] text-gray-500">{shop.regionLabel}</span>
              </div>
              <button
                onClick={() => addPremium(shop.id)}
                className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-600 hover:bg-amber-100"
              >
                + 추가
              </button>
            </div>
          ))}
          {!loading && availableShops.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-400">추가 가능한 일반 업소가 없습니다.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
