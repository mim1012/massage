'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building, Check, Mail, Phone, UserCheck, X } from 'lucide-react';
import clsx from 'clsx';
import type { User } from '@/lib/types';

type ApprovalResponse = {
  pendingUsers?: User[];
  processedUsers?: User[];
  error?: string;
};

export default function ApprovalsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pendingUsers = useMemo(() => users.filter((user) => user.status === 'pending'), [users]);
  const processedUsers = useMemo(() => users.filter((user) => user.status !== 'pending'), [users]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/approvals', { cache: 'no-store' });
      const result = (await response.json()) as ApprovalResponse;

      if (!response.ok) {
        setError(result.error ?? '승인 요청 목록을 불러오지 못했습니다.');
        setLoading(false);
        return;
      }

      setUsers([...(result.pendingUsers ?? []), ...(result.processedUsers ?? [])]);
      setLoading(false);
    };

    void load();
  }, []);

  const updateStatus = async (id: string, action: 'approve' | 'reject') => {
    setError(null);

    const response = await fetch(`/api/admin/approvals/${id}/${action}`, {
      method: 'PATCH',
    });
    const result = (await response.json()) as { user?: User; error?: string };

    if (!response.ok || !result.user) {
      setError(result.error ?? '상태를 변경하지 못했습니다.');
      return;
    }

    setUsers((current) => current.map((user) => (user.id === id ? result.user! : user)));
  };

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <UserCheck className="h-5 w-5 text-red-600" /> 업주 승인 관리
        </h1>
        <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-500">
          대기 중인 요청: {pendingUsers.length}건
        </div>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 border-b pb-2 text-lg font-bold text-gray-800">승인 대기 요청 ({pendingUsers.length})</h2>

        {loading ? <div className="mb-4 text-sm text-gray-500">승인 요청을 불러오는 중...</div> : null}

        {!loading && pendingUsers.length === 0 ? (
          <div className="py-8 text-center text-gray-500">대기 중인 업주 요청이 없습니다.</div>
        ) : null}

        {!loading ? (
          <div className="grid gap-4">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col justify-between gap-4 rounded-lg border border-red-100 bg-red-50/30 p-4 md:flex-row md:items-center"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-800">{user.businessName || '상호 정보 없음'}</span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">업주심사대기</span>
                  </div>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-gray-600 sm:grid-cols-2">
                    <div className="flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5" />
                      사업자번호: {user.businessNumber || '-'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5" />
                      담당자: {user.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      연락처: {user.phone || '-'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      이메일: {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void updateStatus(user.id, 'approve')}
                    className="flex items-center gap-1 rounded bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
                  >
                    <Check className="h-4 w-4" /> 승인
                  </button>
                  <button
                    onClick={() => void updateStatus(user.id, 'reject')}
                    className="flex items-center gap-1 rounded bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-300"
                  >
                    <X className="h-4 w-4" /> 반려
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 border-b pb-2 text-lg font-bold text-gray-800">처리 완료 요청</h2>
        {processedUsers.length === 0 ? (
          <div className="py-8 text-center text-gray-500">아직 처리된 요청이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-center font-bold">상태</th>
                  <th className="px-4 py-2 font-bold">업소명</th>
                  <th className="px-4 py-2 font-bold">이메일</th>
                  <th className="px-4 py-2 font-bold">연락처</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center">
                      <span
                        className={clsx(
                          'rounded-full px-2 py-1 text-xs font-bold',
                          user.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                        )}
                      >
                        {user.status === 'approved' ? '승인완료' : '반려됨'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-bold text-gray-800">{user.businessName || '-'}</td>
                    <td className="px-4 py-2 text-gray-500">{user.email}</td>
                    <td className="px-4 py-2 text-gray-500">{user.phone || '-'}</td>
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
