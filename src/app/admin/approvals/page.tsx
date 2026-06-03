'use client';

import { useState, useEffect, useRef } from 'react';
import { UserCheck, Check, X, Phone, Mail, User, Clock } from 'lucide-react';
import type { User as UserType } from '@/lib/types';
import clsx from 'clsx';

type ApprovalData = {
  pendingUsers: UserType[];
  processedUsers: UserType[];
};

export default function ApprovalsPage() {
  const [data, setData] = useState<ApprovalData>({ pendingUsers: [], processedUsers: [] });
  const pendingRef = useRef<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/admin/approvals')
      .then(r => r.json())
      .then((d: ApprovalData) => setData(d));
  }, []);

  const handleApprove = async (userId: string) => {
    if (pendingRef.current.has(userId)) return;
    pendingRef.current.add(userId);
    setPendingIds(new Set(pendingRef.current));
    try {
      const res = await fetch(`/api/admin/approvals/${userId}/approve`, { method: 'PATCH' });
      if (res.ok) {
        setData(prev => {
          const target = prev.pendingUsers.find(u => u.id === userId);
          if (!target) return prev;
          return {
            pendingUsers: prev.pendingUsers.filter(u => u.id !== userId),
            processedUsers: [{ ...target, status: 'approved' as const }, ...prev.processedUsers],
          };
        });
      }
    } finally {
      pendingRef.current.delete(userId);
      setPendingIds(new Set(pendingRef.current));
    }
  };

  const handleReject = async (userId: string) => {
    if (pendingRef.current.has(userId)) return;
    pendingRef.current.add(userId);
    setPendingIds(new Set(pendingRef.current));
    try {
      const res = await fetch(`/api/admin/approvals/${userId}/reject`, { method: 'PATCH' });
      if (res.ok) {
        setData(prev => {
          const target = prev.pendingUsers.find(u => u.id === userId);
          if (!target) return prev;
          return {
            pendingUsers: prev.pendingUsers.filter(u => u.id !== userId),
            processedUsers: [{ ...target, status: 'rejected' as const }, ...prev.processedUsers],
          };
        });
      }
    } finally {
      pendingRef.current.delete(userId);
      setPendingIds(new Set(pendingRef.current));
    }
  };

  const displayName = (u: UserType) => u.businessName?.trim() || u.name;

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-red-600" /> 입점 업주 승인 관리
        </h1>
        <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          대기 중인 요청: {data.pendingUsers.length}건
        </div>
      </div>

      {/* 승인 대기 목록 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">대기 중인 업주 등록 요청 ({data.pendingUsers.length})</h2>

        {data.pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">대기 중인 업주 등록 요청이 없습니다.</div>
        ) : (
          <div className="grid gap-4">
            {data.pendingUsers.map(user => (
              <div key={user.id} className="border border-red-100 bg-red-50/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-gray-800">{displayName(user)}</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">업주심사대기</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> 이름: {user.name}</div>
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> 이메일: {user.email}</div>
                    {user.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> 연락처: {user.phone}</div>}
                    {user.businessNumber && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> 사업자번호: {user.businessNumber}</div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button disabled={pendingIds.has(user.id)} onClick={() => handleApprove(user.id)} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm transition-colors disabled:opacity-50">
                    <Check className="w-4 h-4"/> 등록승인
                  </button>
                  <button disabled={pendingIds.has(user.id)} onClick={() => handleReject(user.id)} className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-bold text-sm transition-colors disabled:opacity-50">
                    <X className="w-4 h-4"/> 반려
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 최근 처리 내역 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">최근 업주 처리 내역</h2>
        {data.processedUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">처리 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-bold text-center">상태</th>
                  <th className="px-4 py-2 font-bold">업체명/이름</th>
                  <th className="px-4 py-2 font-bold">이메일</th>
                  <th className="px-4 py-2 font-bold">연락처</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.processedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center">
                      <span className={clsx("px-2 py-1 text-xs rounded-full font-bold",
                        user.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {user.status === 'approved' ? '승인완료' : '반려됨'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-bold text-gray-800">{displayName(user)}</td>
                    <td className="px-4 py-2 text-gray-500">{user.email}</td>
                    <td className="px-4 py-2 text-gray-500">{user.phone ?? '-'}</td>
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
