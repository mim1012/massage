'use client';

import { useEffect, useState } from 'react';
import { Crown, Search, X, MoveUp, MoveDown, Save, CheckCircle2 } from 'lucide-react';
import { REGIONS } from '@/lib/catalog';
import clsx from 'clsx';

interface Shop {
  id: string;
  name: string;
  regionLabel: string;
  subRegionLabel?: string;
  isPremium: boolean;
  premiumOrder?: number;
}

export default function PremiumManagementPage() {
  const [selectedRegion, setSelectedRegion] = useState('seoul');
  const [premiumShops, setPremiumShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    void loadPremiumShops();
  }, [selectedRegion]);

  async function loadPremiumShops() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shops?region=${selectedRegion}`);
      const data = await res.json();
      const shops = (data.shops || []) as Shop[];
      setPremiumShops(
        shops
          .filter((s) => s.isPremium)
          .sort((a, b) => (a.premiumOrder ?? 999) - (b.premiumOrder ?? 999))
          .slice(0, 4),
      );
    } finally {
      setLoading(false);
    }
  }

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null);
      return;
    }

    const nextShops = [...premiumShops];
    const itemToMove = nextShops[draggedIdx];
    if (!itemToMove) return;

    nextShops.splice(draggedIdx, 1);
    nextShops.splice(idx, 0, itemToMove);

    setPremiumShops(nextShops.map((s, i) => ({ ...s, premiumOrder: i + 1 })));
    setDraggedIdx(null);
  };

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const res = await fetch(`/api/admin/shops?region=${selectedRegion}`);
        const data = await res.json();
        const shops = (data.shops || []) as Shop[];
        // Filter out shops that are already in the premium slots
        setSearchResults(shops.filter((s) => !premiumShops.some((p) => p.id === s.id)));
      } catch (e) {
        console.error(e);
      }
    };
    void loadCandidates();
  }, [selectedRegion, premiumShops]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`/api/admin/shops?q=${searchQuery}&region=${selectedRegion}`);
      const data = await res.json();
      setSearchResults(data.shops || []);
    } catch (e) {
      console.error(e);
    }
  }

  function addToPremium(shop: Shop) {
    if (premiumShops.length >= 4) {
      alert('프리미엄 배너는 지역별 최대 4개까지만 설정 가능합니다.');
      return;
    }
    if (premiumShops.some((s) => s.id === shop.id)) return;
    setPremiumShops([...premiumShops, { ...shop, isPremium: true, premiumOrder: premiumShops.length + 1 }]);
    setSearchResults([]);
    setSearchQuery('');
  }

  function removeFromPremium(id: string) {
    setPremiumShops(premiumShops.filter((s) => s.id !== id).map((s, i) => ({ ...s, premiumOrder: i + 1 })));
  }

  async function saveChanges() {
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/admin/shops?region=${selectedRegion}`);
      const data = await res.json();
      const currentShops = (data.shops || []) as Shop[];

      for (const s of currentShops) {
        if (s.isPremium) {
          await fetch(`/api/admin/shops/${s.id}/premium`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPremium: false }),
          });
        }
      }

      for (let i = 0; i < premiumShops.length; i++) {
        await fetch(`/api/admin/shops/${premiumShops[i].id}/premium`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPremium: true, premiumOrder: i + 1 }),
        });
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      setSaveStatus('error');
    }
  }

  return (
    <div className="max-w-[1000px] space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-black text-gray-800">
          <Crown className="h-6 w-6 text-amber-500" /> 지역별 프리미엄 배너 관리 (4개)
        </h1>
        <button
          onClick={saveChanges}
          disabled={saveStatus === 'saving'}
          className={clsx(
            'flex items-center gap-2 rounded-lg px-6 py-2.5 font-bold text-white transition-all',
            saveStatus === 'saving' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-md active:scale-95',
          )}
        >
          {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'success' ? '저장 완료!' : '배너 설정 저장'}
          {saveStatus === 'success' && <CheckCircle2 className="h-5 w-5" />}
          {saveStatus !== 'saving' && saveStatus !== 'success' && <Save className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="w-48 shrink-0 space-y-2">
          <label className="text-xs font-bold text-gray-400">지역 선택</label>
          <div className="flex flex-col gap-1">
            {REGIONS.filter((r) => r.code !== 'all').map((region) => (
              <button
                key={region.code}
                onClick={() => setSelectedRegion(region.code)}
                className={clsx(
                  'rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors',
                  selectedRegion === region.code ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {region.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-lg font-black text-gray-800">
              [{REGIONS.find((r) => r.code === selectedRegion)?.label}] 배너 슬롯
            </h2>
            <span className="text-xs text-gray-400">드래그하여 순서를 변경하세요.</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((idx) => {
              const shop = premiumShops[idx];
              return (
                <div
                  key={idx}
                  draggable={!!shop}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  className={clsx(
                    'relative flex h-32 flex-col items-center justify-center rounded-2xl border-2 transition-all',
                    shop
                      ? 'cursor-move border-amber-200 bg-amber-50 shadow-sm hover:border-amber-400'
                      : 'border-dashed border-gray-200 bg-gray-50',
                    draggedIdx === idx && 'opacity-40 scale-95 border-blue-500',
                  )}
                >
                  <div className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-amber-600 shadow-sm border border-amber-100">
                    {idx + 1}
                  </div>

                  {shop ? (
                    <div className="flex w-full flex-col items-center p-4">
                      <p className="max-w-full truncate font-black text-gray-800">{shop.name}</p>
                      <p className="text-[10px] text-amber-600 font-bold">
                        {shop.regionLabel} {shop.subRegionLabel}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromPremium(shop.id);
                          }}
                          className="ml-2 rounded bg-white p-1.5 text-gray-400 shadow-sm hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-300">
                      <Search className="mx-auto mb-1 h-6 w-6 opacity-30" />
                      <p className="text-xs font-bold italic">비어 있음</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl bg-gray-50 p-4 border border-gray-100">
            <h3 className="mb-3 text-sm font-black text-gray-700">배너에 추가할 업소 검색</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="업소명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-amber-500"
              />
              <button
                onClick={handleSearch}
                className="rounded-lg bg-gray-800 px-6 py-2 text-sm font-bold text-white hover:bg-black"
              >
                검색
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                {searchResults.map((shop) => (
                  <div key={shop.id} className="flex items-center justify-between p-3 transition-colors hover:bg-gray-50">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-gray-800">{shop.name}</p>
                      <p className="text-[11px] text-gray-400">{shop.regionLabel} {shop.subRegionLabel}</p>
                    </div>
                    <button
                      onClick={() => addToPremium(shop)}
                      className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-700 hover:bg-amber-500 hover:text-white"
                    >
                      배너 등록
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
