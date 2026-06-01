'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit2, Crown, Store } from 'lucide-react';
import { MOCK_SHOPS, MOCK_USERS } from '@/lib/mockData';
import { Shop, REGIONS, REGION_MAP, UserRole } from '@/lib/types';
import clsx from 'clsx';

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>(MOCK_SHOPS);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(MOCK_USERS[0]);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = () => {
      const isOwner = document.body.innerText.includes('내 업소 관리 모드');
      setCurrentUser(isOwner ? MOCK_USERS[1] : MOCK_USERS[0]);
    };
    checkRole();
    const interval = setInterval(checkRole, 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = shops.filter(shop => {
    const isMyShop = currentUser.role === 'OWNER' ? shop.ownerId === currentUser.id : true;
    let mRegion = regionFilter === 'all';
    if (!mRegion) {
      const mapped = REGION_MAP[regionFilter];
      mRegion = mapped ? shop.region === mapped : shop.region === regionFilter;
    }
    const mSearch = !search || shop.name.includes(search) || shop.address.includes(search);
    return isMyShop && mRegion && mSearch;
  });

  const toggleVisibility = (id: string) => {
    if (currentUser.role !== 'ADMIN') return alert('최고 관리자만 접근 가능합니다.');
    setShops(prev => prev.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s));
  };

  const togglePremium = (id: string) => {
    if (currentUser.role !== 'ADMIN') return alert('최고 관리자만 접근 가능합니다.');
    setShops(prev => prev.map(s => s.id === id ? { ...s, isPremium: !s.isPremium } : s));
  };

  return (
    <div className="max-w-[1200px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Store className="w-5 h-5 text-[#D4A373]" /> {currentUser.role === 'ADMIN' ? '업소 목록 관리' : '내 업소 관리'}
        </h1>
        {(currentUser.role === 'ADMIN' || currentUser.role === 'OWNER') && (
          <Link href="/admin/shops/new"
            className="flex items-center gap-1 bg-[#D4A373] text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-[#C29262] transition-colors">
            <Plus className="w-4 h-4" /> 업소 등록
          </Link>
        )}
      </div>

      {/* 검색 필터 */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 border border-gray-200 rounded">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="업소명, 주소 검색" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:border-[#D4A373] outline-none" />
        </div>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-[#D4A373] outline-none">
          {REGIONS.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
        </select>
      </div>

      {/* 업소 목록 테이블 */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden table-wrap">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap table-responsive">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2 font-bold w-16 text-center">노출</th>
              <th className="px-4 py-2 font-bold w-12 text-center">AD</th>
              <th className="px-4 py-2 font-bold">업소명</th>
              <th className="px-4 py-2 font-bold">지역/테마</th>
              <th className="px-4 py-2 font-bold">연락처</th>
              <th className="px-4 py-2 font-bold w-20 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(shop => (
              <tr key={shop.id} className="hover:bg-gray-100 transition-colors">
                {/* ON/OFF 토글 */}
                <td data-label="노출" className="px-4 py-2 text-center">
                  <button
                    onClick={() => toggleVisibility(shop.id)}
                    disabled={currentUser.role !== 'ADMIN'}
                    className={clsx(
                      'toggle-switch inline-block',
                      shop.isVisible ? 'on' : 'off',
                      currentUser.role !== 'ADMIN' && 'opacity-50 cursor-not-allowed'
                    )}
                    title={shop.isVisible ? '노출 중 (클릭하여 숨김)' : '숨김 (클릭하여 노출)'}
                  >
                    <div className="toggle-knob" />
                  </button>
                  <span className={clsx('block text-[10px] mt-0.5 font-bold', shop.isVisible ? 'text-green-600' : 'text-gray-400')}>
                    {shop.isVisible ? 'ON' : 'OFF'}
                  </span>
                </td>
                <td data-label="AD" className="px-4 py-2 text-center">
                  <button
                    onClick={() => togglePremium(shop.id)}
                    disabled={currentUser.role !== 'ADMIN'}
                    className={clsx('p-1 rounded text-white transition-colors',
                      shop.isPremium ? 'bg-amber-500' : 'bg-gray-300',
                      currentUser.role === 'ADMIN' && !shop.isPremium && 'hover:bg-gray-400',
                      currentUser.role !== 'ADMIN' && 'opacity-50 cursor-not-allowed'
                    )}
                    title={shop.isPremium ? 'AD 해제' : 'AD 등록'}
                  >
                    <Crown className="w-3.5 h-3.5" />
                  </button>
                </td>
                <td data-label="업소명" className="px-4 py-2 font-bold text-gray-800">
                  <Link href={`/admin/shops/${shop.id}`} className="hover:text-[#D4A373] hover:underline">{shop.name}</Link>
                  {!shop.isVisible && (
                    <span className="ml-2 text-[10px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded">숨김</span>
                  )}
                </td>
                <td data-label="지역/테마" className="px-4 py-2 text-xs text-gray-500">
                  {shop.regionLabel} {shop.subRegionLabel ? `> ${shop.subRegionLabel}` : ''} / {shop.themeLabel}
                </td>
                <td data-label="연락처" className="px-4 py-2 text-xs text-gray-500">{shop.phone}</td>
                <td data-label="관리" className="px-4 py-2 text-center whitespace-nowrap">
                  <button onClick={() => setEditId(shop.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-[#FEFAE0] border border-[#D4A373]/30 rounded text-xs text-[#D4A373] font-bold shadow-sm">
                    <Edit2 className="w-3 h-3" /> 버튼 수정
                  </button>
                  <Link href={`/admin/shops/${shop.id}`}
                    className="ml-1.5 inline-flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs text-gray-500">
                    상세입력
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">목록이 없습니다.</div>}
      </div>
    </div>

      {editId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-lg font-black text-gray-900 mb-4 border-b pb-2">업소 정보 (빠른 수정)</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">업소명</label>
                <input type="text" defaultValue={shops.find(s=>s.id===editId)?.name} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#D4A373] text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">연락처</label>
                <input type="text" defaultValue={shops.find(s=>s.id===editId)?.phone} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#D4A373] text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setEditId(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-600 transition-colors">취소</button>
              <button autoFocus onClick={() => { alert('수정된 기존 정보가 성공적으로 저장되었습니다.'); setEditId(null); }} className="px-4 py-2 bg-[#D4A373] hover:bg-[#C29262] rounded-lg text-sm font-bold text-white shadow-md transition-colors">저장 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
      align-items: center;
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
  const styleId = 'shop-admin-styles';
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
  }
}
