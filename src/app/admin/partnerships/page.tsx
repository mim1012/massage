'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  ClipboardList,
  Eye,
  MapPin,
  Search,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import type { PartnershipInquiry } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: '전체 상태' },
  { value: 'pending', label: '접수대기' },
  { value: 'contacted', label: '상담중' },
  { value: 'completed', label: '완료' },
] as const;

export default function AdminPartnershipsPage() {
  const [inquiries, setInquiries] = useState<PartnershipInquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]['value']>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<PartnershipInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/partnerships', { cache: 'no-store' });
        const result = (await response.json()) as { inquiries?: PartnershipInquiry[]; error?: string };
        if (!response.ok || !result.inquiries) {
          throw new Error(result.error ?? '제휴 문의 목록을 불러오지 못했습니다.');
        }

        setInquiries(result.inquiries);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '제휴 문의 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filtered = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return inquiries.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.shopName.toLowerCase().includes(normalizedSearch) ||
        item.contactName.toLowerCase().includes(normalizedSearch) ||
        item.phone.includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inquiries, searchQuery, statusFilter]);

  async function removeInquiry(id: string) {
    setError(null);

    const response = await fetch(`/api/admin/partnerships/${id}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? '제휴 문의를 삭제하지 못했습니다.');
      return;
    }

    setInquiries((current) => current.filter((item) => item.id !== id));
    if (selectedInquiry?.id === id) {
      setSelectedInquiry(null);
    }
  }

  async function updateStatus(id: string, status: PartnershipInquiry['status']) {
    setError(null);

    const response = await fetch(`/api/admin/partnerships/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? '제휴 문의 상태를 변경하지 못했습니다.');
      return;
    }

    setInquiries((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    setSelectedInquiry((current) => (current?.id === id ? { ...current, status } : current));
  }

  const getStatusBadge = (status: PartnershipInquiry['status']) => {
    switch (status) {
      case 'pending':
        return <span className="rounded-full bg-yellow-100 px-2 py-1 text-[11px] font-bold text-yellow-700">접수대기</span>;
      case 'contacted':
        return <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-700">상담중</span>;
      case 'completed':
        return <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] font-bold text-green-700">완료</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
            <ClipboardList className="h-5 w-5 text-red-600" /> 입점 문의 관리
          </h1>
          <p className="mt-1 text-xs text-gray-500">사용자가 접수한 입점 문의 내역을 확인하고 처리 상태를 관리합니다.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="업체명, 담당자, 연락처 검색..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number]['value'])}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

      <div className="table-wrap overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="table-responsive w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-bold text-gray-600">접수일</th>
                <th className="px-4 py-3 font-bold text-gray-600">업체명</th>
                <th className="px-4 py-3 font-bold text-gray-600">지역</th>
                <th className="px-4 py-3 font-bold text-gray-600">테마</th>
                <th className="px-4 py-3 font-bold text-gray-600">담당자</th>
                <th className="px-4 py-3 font-bold text-gray-600">상태</th>
                <th className="px-4 py-3 text-right font-bold text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                    제휴 문의 목록을 불러오는 중입니다.
                  </td>
                </tr>
              ) : null}

              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : null}

              {!loading &&
                filtered.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-gray-100">
                    <td data-label="접수일" className="whitespace-nowrap px-4 py-4 text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td data-label="업체명" className="px-4 py-4 font-bold text-gray-900">
                      {item.shopName}
                    </td>
                    <td data-label="지역" className="px-4 py-4 text-gray-600">
                      {item.region} / {item.subRegion}
                    </td>
                    <td data-label="테마" className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {item.theme}
                    </td>
                    <td data-label="담당자" className="px-4 py-4">
                      <div className="font-medium text-gray-900">{item.contactName}</div>
                      <div className="text-xs text-gray-400">{item.phone}</div>
                    </td>
                    <td data-label="상태" className="px-4 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td data-label="관리" className="px-4 py-4 text-right">
                      <button
                        onClick={() => setSelectedInquiry(item)}
                        className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                        title="상세 보기"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInquiry ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white font-sans shadow-2xl">
            <div className="flex items-center justify-between bg-red-600 p-4 text-white">
              <h2 className="font-bold">입점 문의 상세 정보</h2>
              <button onClick={() => setSelectedInquiry(null)} className="rounded-lg p-1 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">업체명</p>
                  <p className="flex items-center gap-1.5 text-sm font-black text-gray-800">
                    <Building2 className="h-3.5 w-3.5 text-red-500" /> {selectedInquiry.shopName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">테마</p>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-red-600">
                    <Tag className="h-3.5 w-3.5" /> {selectedInquiry.theme}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">담당자 / 연락처</p>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                    <User className="h-3.5 w-3.5" /> {selectedInquiry.contactName}
                  </p>
                  <p className="ml-5 text-sm font-medium text-gray-600">{selectedInquiry.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">지역</p>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                    <MapPin className="h-3.5 w-3.5" /> {selectedInquiry.region} / {selectedInquiry.subRegion}
                  </p>
                </div>
              </div>

              {selectedInquiry.kakaoId ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">카카오톡 ID</p>
                  <p className="ml-1 text-sm font-bold text-yellow-600">💬 {selectedInquiry.kakaoId}</p>
                </div>
              ) : null}

              <div className="space-y-1 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">문의 내용</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{selectedInquiry.message}</p>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">상태 변경</p>
                <div className="flex gap-2">
                  {(['pending', 'contacted', 'completed'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => void updateStatus(selectedInquiry.id, status)}
                      className={clsx(
                        'flex-1 rounded-lg border py-2 text-xs font-bold transition-all',
                        selectedInquiry.status === status
                          ? 'border-red-600 bg-red-600 text-white shadow-md shadow-red-100'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-red-200',
                      )}
                    >
                      {status === 'pending' ? '접수대기' : status === 'contacted' ? '상담중' : '완료'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => void removeInquiry(selectedInquiry.id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> 내역 삭제
                </button>
                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Calendar className="h-3 w-3" /> 접수: {formatDate(selectedInquiry.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = `
  .table-wrap {
    width: 100%;
    overflow-x: auto;
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
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border: 1px solid #f0f0f0;
    }

    .table-responsive td {
      display: flex;
      justify-content: space-between;
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
  const styleId = 'partnership-admin-styles';
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
  }
}
