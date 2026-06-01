'use client';

import { useState } from 'react';
import { 
  ClipboardList, Search, Filter, MoreVertical, Eye, 
  CheckCircle, Clock, MessageCircle, Trash2, Calendar, 
  MapPin, Phone, User, Tag, Building2
} from 'lucide-react';
import { MOCK_PARTNERSHIPS } from '@/lib/mockData';
import { PartnershipInquiry } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import clsx from 'clsx';

export default function AdminPartnershipsPage() {
  const [inquiries, setInquiries] = useState<PartnershipInquiry[]>(MOCK_PARTNERSHIPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'contacted' | 'completed'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<PartnershipInquiry | null>(null);

  const filtered = inquiries.filter(item => {
    const matchesSearch = item.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = (id: string, newStatus: PartnershipInquiry['status']) => {
    setInquiries(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    if (selectedInquiry?.id === id) {
      setSelectedInquiry(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const deleteInquiry = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setInquiries(prev => prev.filter(item => item.id !== id));
      setSelectedInquiry(null);
    }
  };

  const getStatusBadge = (status: PartnershipInquiry['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[11px] font-bold">접수대기</span>;
      case 'contacted':
        return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">상담중</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold">완료</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-600" /> 입점 문의 관리
          </h1>
          <p className="text-xs text-gray-500 mt-1">사용자가 접수한 입점 문의 내역을 확인하고 처리 상태를 관리합니다.</p>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="업체명, 담당자, 연락처 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
          >
            <option value="all">전체 상태</option>
            <option value="pending">접수대기</option>
            <option value="contacted">상담중</option>
            <option value="completed">완료</option>
          </select>
        </div>
      </div>

      {/* 목록 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden table-wrap">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-responsive">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-bold text-gray-600">접수일</th>
                <th className="px-4 py-3 font-bold text-gray-600">업체명</th>
                <th className="px-4 py-3 font-bold text-gray-600">지역</th>
                <th className="px-4 py-3 font-bold text-gray-600">테마</th>
                <th className="px-4 py-3 font-bold text-gray-600">담당자</th>
                <th className="px-4 py-3 font-bold text-gray-600">상태</th>
                <th className="px-4 py-3 font-bold text-gray-600 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">데이터가 없습니다.</td>
                </tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-100 transition-colors">
                  <td data-label="접수일" className="px-4 py-4 text-gray-500 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                  <td data-label="업체명" className="px-4 py-4 font-bold text-gray-900">{item.shopName}</td>
                  <td data-label="지역" className="px-4 py-4 text-gray-600">{item.region} / {item.subRegion}</td>
                  <td data-label="테마" className="px-4 py-4 text-gray-600 whitespace-nowrap">{item.theme}</td>
                  <td data-label="담당자" className="px-4 py-4">
                    <div className="text-gray-900 font-medium">{item.contactName}</div>
                    <div className="text-xs text-gray-400">{item.phone}</div>
                  </td>
                  <td data-label="상태" className="px-4 py-4">{getStatusBadge(item.status)}</td>
                  <td data-label="관리" className="px-4 py-4 text-right">
                    <button 
                      onClick={() => setSelectedInquiry(item)}
                      className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                      title="상세 보기"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세 보기 모달 */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 font-sans">
            <div className="bg-red-600 p-4 text-white flex items-center justify-between">
              <h2 className="font-bold">입점 문의 상세 정보</h2>
              <button onClick={() => setSelectedInquiry(null)} className="hover:bg-white/20 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">업체명</p>
                  <p className="text-sm font-black text-gray-800 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-red-500" /> {selectedInquiry.shopName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">테마</p>
                  <p className="text-sm font-bold text-red-600 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {selectedInquiry.theme}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">담당자 / 연락처</p>
                  <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {selectedInquiry.contactName}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 ml-5 font-medium">{selectedInquiry.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">지역</p>
                  <p className="text-sm text-gray-800 flex items-center gap-1.5 font-medium"><MapPin className="w-3.5 h-3.5" /> {selectedInquiry.region} / {selectedInquiry.subRegion}</p>
                </div>
              </div>

              {selectedInquiry.kakaoId && (
                <div className="space-y-1">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">카카오톡 ID</p>
                  <p className="text-sm font-bold text-yellow-600 flex items-center gap-1.5 ml-1">💬 {selectedInquiry.kakaoId}</p>
                </div>
              )}

              <div className="space-y-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">문의 내용</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">상태 변경</p>
                <div className="flex gap-2">
                  {(['pending', 'contacted', 'completed'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedInquiry.id, s)}
                      className={clsx(
                        "flex-1 py-2 text-xs font-bold rounded-lg border transition-all",
                        selectedInquiry.status === s 
                          ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-100" 
                          : "bg-white border-gray-200 text-gray-500 hover:border-red-200"
                      )}
                    >
                      {s === 'pending' ? '접수대기' : s === 'contacted' ? '상담중' : '완료'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button 
                  onClick={() => deleteInquiry(selectedInquiry.id)}
                  className="flex items-center gap-1.5 text-xs text-red-500 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> 내역 삭제
                </button>
                <div className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> 접수: {formatDate(selectedInquiry.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
}

// 모바일 대응 커스텀 CSS
const styles = `
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }

  .table td {
    word-break: keep-all;
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

// 컴포넌트에 주입
if (typeof document !== 'undefined') {
  const styleId = 'partnership-admin-styles';
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
  }
}
