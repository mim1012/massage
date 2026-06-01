'use client';

import { useState } from 'react';
import { Crown, Save, Info, GripVertical, X, Plus } from 'lucide-react';
import { MOCK_SHOPS } from '@/lib/mockData';
import { Shop, REGIONS } from '@/lib/types';
import clsx from 'clsx';

const MAX_PER_REGION = 4;

export default function AdminPremiumPage() {
  const [premiumShops, setPremiumShops] = useState<Shop[]>(
    MOCK_SHOPS.filter(s => s.isPremium).sort((a, b) => (a.premiumOrder ?? 0) - (b.premiumOrder ?? 0))
  );
  const [allShops] = useState<Shop[]>(MOCK_SHOPS.filter(s => !s.isPremium));
  const [filterRegion, setFilterRegion] = useState('all');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  // 지역별 카운트
  const countByRegion = (region: string) =>
    premiumShops.filter(s => s.region === region).length;

  const canAdd = (region: string) => countByRegion(region) < MAX_PER_REGION;

  const removePremium = (id: string) => {
    setPremiumShops(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, premiumOrder: i + 1 })));
  };

  const addPremium = (id: string) => {
    const shop = allShops.find(s => s.id === id);
    if (!shop) return;
    if (!canAdd(shop.region)) {
      alert(`${shop.regionLabel} 지역은 최대 ${MAX_PER_REGION}개까지만 등록 가능합니다.`);
      return;
    }
    setPremiumShops(prev => [...prev, { ...shop, isPremium: true, premiumOrder: prev.length + 1 }]);
  };

  // 드래그 순서 변경
  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) { setDragIndex(null); setDragOverIndex(null); return; }
    const newItems = [...premiumShops];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(idx, 0, moved);
    setPremiumShops(newItems.map((s, i) => ({ ...s, premiumOrder: i + 1 })));
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const displayPremium = filterRegion === 'all'
    ? premiumShops
    : premiumShops.filter(s => s.region === filterRegion);

  const availableToAdd = allShops.filter(s =>
    !premiumShops.find(p => p.id === s.id) &&
    (filterRegion === 'all' || s.region === filterRegion)
  );

  return (
    <div className="max-w-[800px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" /> 프리미엄 배너 관리
        </h1>
        <button
          onClick={handleSave}
          className={clsx(
            "flex items-center gap-1 px-4 py-2 rounded text-sm font-bold transition-colors",
            saved ? "bg-green-600 text-white" : "bg-red-600 text-white hover:bg-red-700"
          )}
        >
          <Save className="w-4 h-4" /> {saved ? '저장 완료!' : '저장'}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded flex items-start gap-1.5">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>지역별 최대 <strong>{MAX_PER_REGION}개</strong>까지 등록 가능합니다. 드래그하여 순서를 변경하세요. 이미지 규격: <strong>1200×600</strong></p>
      </div>

      {/* 지역 필터 + 카운트 */}
      <div className="flex gap-2 flex-wrap items-center bg-white border border-gray-200 rounded p-3">
        <span className="text-xs font-bold text-gray-600">지역 필터:</span>
        {[{ code: 'all', label: '전체' }, ...REGIONS.filter(r => r.code !== 'all')].map(r => {
          const cnt = r.code === 'all' ? premiumShops.length : countByRegion(r.code);
          const full = r.code !== 'all' && cnt >= MAX_PER_REGION;
          return (
            <button
              key={r.code}
              onClick={() => setFilterRegion(r.code)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                filterRegion === r.code ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-300 text-gray-600 bg-white hover:border-amber-300',
                full && 'border-red-300 text-red-500'
              )}
            >
              {r.label}
              {r.code !== 'all' && cnt > 0 && (
                <span className={clsx('ml-1 font-black', full ? 'text-red-500' : 'text-amber-600')}>{cnt}/{MAX_PER_REGION}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 현재 프리미엄 목록 - 드래그 순서 */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-600">
            현재 적용된 배너 ({displayPremium.length})
          </span>
          <span className="text-[11px] text-gray-400">드래그하여 순서 변경</span>
        </div>
        <div className="divide-y divide-gray-100">
          {displayPremium.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">등록된 프리미엄 배너가 없습니다.</div>
          )}
          {displayPremium.map((shop, idx) => {
            const realIdx = premiumShops.findIndex(s => s.id === shop.id);
            return (
              <div
                key={shop.id}
                draggable
                onDragStart={() => handleDragStart(realIdx)}
                onDragOver={e => handleDragOver(e, realIdx)}
                onDrop={() => handleDrop(realIdx)}
                onDragEnd={handleDragEnd}
                className={clsx(
                  'p-3 flex items-center gap-3 draggable-item',
                  dragOverIndex === realIdx && dragIndex !== realIdx && 'bg-amber-50 border-l-4 border-amber-400'
                )}
              >
                <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {realIdx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">{shop.name}</p>
                  <p className="text-[11px] text-gray-500">{shop.regionLabel} · {shop.themeLabel}</p>
                </div>
                {/* ON/OFF 토글 */}
                <button className={clsx('toggle-switch', shop.isVisible ? 'on' : 'off')}>
                  <div className="toggle-knob" />
                </button>
                <button
                  onClick={() => removePremium(shop.id)}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 추가 가능 업소 */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
          <span className="text-xs font-bold text-gray-600">일반 업소 목록 (프리미엄 추가)</span>
        </div>
        <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {availableToAdd.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">추가 가능한 업소가 없습니다.</div>
          )}
          {availableToAdd.map(shop => {
            const full = !canAdd(shop.region);
            return (
              <div key={shop.id} className="p-2.5 flex items-center justify-between px-4 hover:bg-gray-50 text-sm">
                <div>
                  <span className="font-semibold text-gray-800">{shop.name}</span>
                  <span className="text-[11px] text-gray-500 ml-2">{shop.regionLabel}</span>
                  {full && <span className="text-[10px] text-red-500 ml-2">({shop.regionLabel} 지역 한도 초과)</span>}
                </div>
                <button
                  onClick={() => addPremium(shop.id)}
                  disabled={full}
                  className={clsx(
                    'px-2 py-1 rounded text-[11px] font-bold flex items-center gap-0.5',
                    full
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                  )}
                >
                  <Plus className="w-3 h-3" /> 추가
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
