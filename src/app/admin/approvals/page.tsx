'use client';

import { useState } from 'react';
import { UserCheck, Check, X, Phone, Store, MapPin, Tag, Clock } from 'lucide-react';
import { MOCK_SHOPS } from '@/lib/mockData';
import { Shop } from '@/lib/types';
import clsx from 'clsx';

export default function ApprovalsPage() {
  const [shops, setShops] = useState<Shop[]>(MOCK_SHOPS);

  // 업소 승인 관련 데이터
  const pendingShops = shops.filter(s => s.approvalStatus === 'pending');
  const processedShops = shops.filter(s => s.approvalStatus && s.approvalStatus !== 'pending');

  const handleApproveShop = (id: string) => {
    if (confirm('업소 등록을 승인하시겠습니까?')) {
      setShops(prev => prev.map(s => s.id === id ? { ...s, approvalStatus: 'approved', isVisible: true } : s));
    }
  };

  const handleRejectShop = (id: string) => {
    if (confirm('업소 등록을 반려하시겠습니까?')) {
      setShops(prev => prev.map(s => s.id === id ? { ...s, approvalStatus: 'rejected', isVisible: false } : s));
    }
  };

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Store className="w-5 h-5 text-red-600" /> 입점 업소 승인 관리
        </h1>
        <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          대기 중인 요청: {pendingShops.length}건
        </div>
      </div>

      {/* 업소 등록 승인 대기 목록 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">대기 중인 업소 등록 요청 ({pendingShops.length})</h2>
        
        {pendingShops.length === 0 ? (
          <div className="text-center py-8 text-gray-500">대기 중인 업소 등록 요청이 없습니다.</div>
        ) : (
          <div className="grid gap-4">
            {pendingShops.map(shop => (
              <div key={shop.id} className="border border-red-100 bg-red-50/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-gray-800">{shop.name}</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">업소심사대기</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> 지역: {shop.regionLabel} {shop.subRegionLabel}</div>
                    <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> 테마: {shop.themeLabel}</div>
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> 연락처: {shop.phone}</div>
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> 영업시간: {shop.hours}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveShop(shop.id)} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm transition-colors">
                    <Check className="w-4 h-4"/> 등록승인
                  </button>
                  <button onClick={() => handleRejectShop(shop.id)} className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-bold text-sm transition-colors">
                    <X className="w-4 h-4"/> 반려
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 최근 처리 내역 - 업소 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">최근 업소 처리 내역</h2>
        {processedShops.length === 0 ? (
          <div className="text-center py-8 text-gray-500">처리 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-bold text-center">상태</th>
                  <th className="px-4 py-2 font-bold">업소명</th>
                  <th className="px-4 py-2 font-bold">지역/테마</th>
                  <th className="px-4 py-2 font-bold">연락처</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedShops.map(shop => (
                  <tr key={shop.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center">
                      <span className={clsx("px-2 py-1 text-xs rounded-full font-bold", 
                        shop.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {shop.approvalStatus === 'approved' ? '승인완료' : '반려됨'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-bold text-gray-800">{shop.name}</td>
                    <td className="px-4 py-2 text-gray-500">{shop.regionLabel} / {shop.themeLabel}</td>
                    <td className="px-4 py-2 text-gray-500">{shop.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
