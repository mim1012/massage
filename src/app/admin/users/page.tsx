'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Crown, RefreshCw, Save, Search, Shield, Store, UserCheck, Users, X } from 'lucide-react';
import type { User } from '@/lib/types';

type UsersResponse = {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
};

type UserStatus = NonNullable<User['status']>;

type EditForm = {
  id: string;
  name: string;
  phone: string;
  role: User['role'];
  status: UserStatus;
};

const PAGE_SIZE = 20;

const roleMap: Record<string, { label: string; bg: string; text: string; icon: typeof Crown }> = {
  ADMIN: { label: '최고관리자', bg: 'bg-purple-100', text: 'text-purple-700', icon: Shield },
  OWNER: { label: '업체관리자', bg: 'bg-amber-100', text: 'text-amber-700', icon: Store },
  USER: { label: '일반회원', bg: 'bg-gray-100', text: 'text-gray-600', icon: UserCheck },
};

const roleEmoji: Record<string, string> = {
  ADMIN: '👑',
  OWNER: '🏢',
  USER: '👤',
};

const statusLabel: Record<UserStatus, string> = {
  pending: '심사중',
  approved: '정상',
  rejected: '반려',
};

const statusClass: Record<UserStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
};

const emptyResponse: UsersResponse = {
  users: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 1,
};

function toStatus(value: User['status']): UserStatus {
  return value ?? 'approved';
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse>(emptyResponse);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditForm | null>(null);
  const requestSeq = useRef(0);

  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  const params = useMemo(() => {
    const nextParams = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });

    if (debouncedQuery.trim()) nextParams.set('q', debouncedQuery.trim());
    if (role !== 'all') nextParams.set('role', role);
    if (status !== 'all') nextParams.set('status', status);

    return nextParams;
  }, [page, debouncedQuery, role, status]);

  const loadUsers = useCallback(async () => {
    const requestId = requestSeq.current + 1;
    requestSeq.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const payload = (await response.json()) as UsersResponse;

      if (requestSeq.current !== requestId) {
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error ?? '회원 목록을 불러오지 못했습니다.');
      }

      setData(payload);
    } catch (caughtError) {
      if (requestSeq.current !== requestId) {
        return;
      }

      setError(caughtError instanceof Error ? caughtError.message : '회원 목록을 불러오지 못했습니다.');
      setData(emptyResponse);
    } finally {
      if (requestSeq.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const resetToFirstPage = () => {
    if (page !== 1) {
      setPage(1);
    }
  };

  const openEditor = (user: User) => {
    setEditing({
      id: user.id,
      name: user.name,
      phone: user.phone ?? '',
      status: toStatus(user.status),
      role: user.role,
    });
    setError(null);
    setModalError(null);
  };

  const saveUser = async () => {
    if (!editing || isSaving) return;
    if (!editing.name.trim()) {
      setModalError('이름을 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setModalError(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          id: editing.id,
          name: editing.name,
          phone: editing.phone,
          status: editing.role === 'OWNER' ? editing.status : undefined,
        }),
      });
      const result = (await response.json()) as { user?: User; error?: string };

      if (!response.ok || !result.user) {
        throw new Error(result.error ?? '회원 정보를 저장하지 못했습니다.');
      }

      setData((current) => ({
        ...current,
        users: current.users.map((user) => (user.id === result.user?.id ? result.user : user)),
      }));
      setEditing(null);
      await loadUsers();
    } catch (caughtError) {
      setModalError(caughtError instanceof Error ? caughtError.message : '회원 정보를 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[1100px] space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <Users className="h-5 w-5 text-red-600" /> 대상별 회원 관리
        </h1>
        <button
          type="button"
          onClick={() => void loadUsers()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 rounded border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      <div className="rounded border border-gray-200 bg-white p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_140px_140px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetToFirstPage();
              }}
              placeholder="이름, 이메일, 연락처, 업체명 검색"
              className="w-full rounded border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-red-400 focus:outline-none"
            />
          </label>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              resetToFirstPage();
            }}
            className="rounded border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
          >
            <option value="all">전체 권한</option>
            <option value="ADMIN">관리자</option>
            <option value="OWNER">업체관리자</option>
            <option value="USER">일반회원</option>
          </select>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              resetToFirstPage();
            }}
            className="rounded border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
          >
            <option value="all">전체 상태</option>
            <option value="approved">정상</option>
            <option value="pending">심사중</option>
            <option value="rejected">반려</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setRole('all');
              setStatus('all');
              setPage(1);
            }}
            className="rounded border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50"
          >
            초기화
          </button>
        </div>
      </div>

      {error ? <div className="rounded border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-xs text-gray-500">
          <span>
            {from.toLocaleString()}-{to.toLocaleString()} / {data.total.toLocaleString()}명
          </span>
          <span>페이지당 {PAGE_SIZE}명</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 font-bold">이름</th>
                <th className="px-4 py-2 font-bold">이메일</th>
                <th className="px-4 py-2 font-bold">연락처</th>
                <th className="px-4 py-2 text-center font-bold">권한</th>
                <th className="px-4 py-2 text-center font-bold">상태</th>
                <th className="px-4 py-2 text-center font-bold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">회원 목록을 불러오는 중입니다...</td>
                </tr>
              ) : data.users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">조건에 맞는 회원 정보가 없습니다.</td>
                </tr>
              ) : (
                data.users.map((user) => {
                  const roleConfig = roleMap[user.role] ?? roleMap.USER;
                  const currentStatus = toStatus(user.status);
                  return (
                    <tr key={user.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-bold text-gray-800">
                        <div>{user.businessName?.trim() || user.name}</div>
                        {user.businessName ? <div className="mt-0.5 text-[10px] font-normal text-gray-400">담당자: {user.name}</div> : null}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{user.email}</td>
                      <td className="px-4 py-2.5 text-gray-500">{user.phone ?? '-'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${roleConfig.bg} ${roleConfig.text}`}>
                          {roleEmoji[user.role] ?? '👤'} {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold ${statusClass[currentStatus]}`}>
                          {statusLabel[currentStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => openEditor(user)}
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-[10px] font-bold text-gray-600 hover:border-red-200 hover:text-red-600"
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={isLoading || data.page <= 1}
            className="inline-flex items-center gap-1 rounded border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 이전
          </button>
          <span className="text-xs font-bold text-gray-500">
            {data.page} / {data.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))}
            disabled={isLoading || data.page >= data.totalPages}
            className="inline-flex items-center gap-1 rounded border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 disabled:opacity-40"
          >
            다음 <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black text-gray-800">회원 정보 수정</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            {modalError ? <div className="mb-3 rounded border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{modalError}</div> : null}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500">
                이름
                <input
                  value={editing.name}
                  onChange={(event) => setEditing((current) => current ? { ...current, name: event.target.value } : current)}
                  className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700 focus:border-red-400 focus:outline-none"
                />
              </label>
              <label className="block text-xs font-bold text-gray-500">
                연락처
                <input
                  value={editing.phone}
                  onChange={(event) => setEditing((current) => current ? { ...current, phone: event.target.value } : current)}
                  className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700 focus:border-red-400 focus:outline-none"
                />
              </label>
              <label className="block text-xs font-bold text-gray-500">
                상태
                <select
                  value={editing.status}
                  onChange={(event) => setEditing((current) => current ? { ...current, status: event.target.value as UserStatus } : current)}
                  disabled={editing.role !== 'OWNER'}
                  className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700 focus:border-red-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="approved">정상</option>
                  <option value="pending">심사중</option>
                  <option value="rejected">반려</option>
                </select>
                {editing.role !== 'OWNER' ? (
                  <p className="mt-1 text-[11px] text-gray-400">상태 변경은 업체관리자 승인 상태에만 적용됩니다.</p>
                ) : null}
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500">
                취소
              </button>
              <button
                type="button"
                onClick={() => void saveUser()}
                disabled={isSaving}
                className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" /> {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
