'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Eye, Trash2 } from 'lucide-react';
import type { PartnershipInquiry } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AdminPartnershipsPage() {
  const [inquiries, setInquiries] = useState<PartnershipInquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<PartnershipInquiry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/admin/partnerships', { cache: 'no-store' });
        const result = (await response.json()) as { inquiries?: PartnershipInquiry[]; error?: string };
        if (!response.ok || !result.inquiries) {
          throw new Error(result.error ?? '제휴 문의 목록을 불러오지 못했습니다.');
        }

        setInquiries(result.inquiries);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '제휴 문의 목록을 불러오지 못했습니다.');
      }
    };

    void load();
  }, []);

  async function removeInquiry(id: string) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <ClipboardList className="h-5 w-5 text-red-600" />
          제휴 문의 관리
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          사용자 제휴 문의를 확인하고 상태를 관리합니다.
        </p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">등록일</th>
                <th className="px-4 py-3 font-bold">업소명</th>
                <th className="px-4 py-3 font-bold">지역</th>
                <th className="px-4 py-3 font-bold">담당자</th>
                <th className="px-4 py-3 font-bold">상태</th>
                <th className="px-4 py-3 text-right font-bold">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inquiries.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{item.shopName}</td>
                  <td className="px-4 py-3 text-gray-600">{item.region} / {item.subRegion}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{item.contactName}</div>
                    <div className="text-xs text-gray-400">{item.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.status}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedInquiry(item)}
                      className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
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
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-red-600 p-4 text-white">
              <h2 className="font-bold">문의 상세 정보</h2>
              <button onClick={() => setSelectedInquiry(null)} className="rounded p-1 hover:bg-white/20">
                닫기
              </button>
            </div>
            <div className="space-y-4 p-6 text-sm text-gray-700">
              <div>
                <div className="text-xs font-bold uppercase text-gray-400">업소명</div>
                <div className="font-bold text-gray-900">{selectedInquiry.shopName}</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-bold uppercase text-gray-400">담당자</div>
                  <div>{selectedInquiry.contactName}</div>
                  <div>{selectedInquiry.phone}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-gray-400">테마 / 지역</div>
                  <div>{selectedInquiry.theme}</div>
                  <div>{selectedInquiry.region} / {selectedInquiry.subRegion}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-gray-400">문의 내용</div>
                <p className="mt-1 rounded-xl bg-gray-50 p-4 leading-relaxed">{selectedInquiry.message}</p>
              </div>
              <div className="flex gap-2">
                {(['pending', 'contacted', 'completed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => void updateStatus(selectedInquiry.id, status)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold ${
                      selectedInquiry.status === status
                        ? 'border-red-600 bg-red-600 text-white'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {status === 'pending' ? '대기' : status === 'contacted' ? '연락 완료' : '처리 완료'}
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => void removeInquiry(selectedInquiry.id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  문의 삭제
                </button>
                <span className="text-xs text-gray-400">{formatDate(selectedInquiry.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
