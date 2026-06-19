'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Check, X, Phone, Store, MapPin, Tag, Clock, Users } from 'lucide-react';
import { MOCK_SHOPS, MOCK_USERS } from '@/lib/mockData';
import { Shop, User } from '@/lib/types';
import clsx from 'clsx';

export default function ApprovalsPage() {
  const [shops, setShops] = useState<Shop[]>(MOCK_SHOPS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  // 업소 등록 승인 관련 데이터
  const pendingShops = shops.filter(s => s.approvalStatus === 'pending');
  const processedShops = shops.filter(s => s.approvalStatus && s.approvalStatus !== 'pending');

  // 입점사 회원 승인 관련 데이터
  const pendingOwners = users.filter(u => u.role === 'OWNER' && u.status === 'pending');
  const processedOwners = users.filter(u => u.role === 'OWNER' && u.status && u.status !== 'pending');

  // 초기 데이터 로드 (localStorage 연동)
  useEffect(() => {
    try {
      const customUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
      const customShops = JSON.parse(localStorage.getItem('custom_shops') || '[]');
      
      // MOCK_USERS와 customUsers 병합 (id 기준 덮어쓰기)
      if (customUsers.length > 0) {
        setUsers(prev => {
          const base = [...prev];
          customUsers.forEach((cu: any) => {
            const idx = base.findIndex(u => u.id === cu.id);
            if (idx >= 0) base[idx] = { ...base[idx], ...cu };
            else base.push(cu);
          });
          return base;
        });
      }

      if (customShops.length > 0) {
        setShops(prev => {
          const base = [...prev];
          customShops.forEach((cs: any) => {
            const idx = base.findIndex(s => s.id === cs.id);
            if (idx >= 0) base[idx] = { ...base[idx], ...cs };
            else base.push(cs);
          });
          return base;
        });
      }
    } catch (e) {}
  }, []);

  const handleApproveShop = (id: string) => {
    if (confirm('업소 등록을 승인하시겠습니까?')) {
      setShops(prev => {
        const next = prev.map(s => s.id === id ? { ...s, approvalStatus: 'approved', isVisible: true } : s);
        // Save to custom_shops
        const shop = next.find(s => s.id === id);
        if (shop) {
          const customShops = JSON.parse(localStorage.getItem('custom_shops') || '[]');
          const idx = customShops.findIndex((s: any) => s.id === id);
          if (idx >= 0) customShops[idx] = shop;
          else customShops.push(shop);
          localStorage.setItem('custom_shops', JSON.stringify(customShops));
        }
        return next;
      });
    }
  };

  const handleRejectShop = (id: string) => {
    if (confirm('업소 등록을 반려하시겠습니까?')) {
      setShops(prev => {
        const next = prev.map(s => s.id === id ? { ...s, approvalStatus: 'rejected', isVisible: false } : s);
        // Save to custom_shops
        const shop = next.find(s => s.id === id);
        if (shop) {
          const customShops = JSON.parse(localStorage.getItem('custom_shops') || '[]');
          const idx = customShops.findIndex((s: any) => s.id === id);
          if (idx >= 0) customShops[idx] = shop;
          else customShops.push(shop);
          localStorage.setItem('custom_shops', JSON.stringify(customShops));
        }
        return next;
      });
    }
  };

  const handleApproveOwner = (id: string) => {
    if (confirm('입점사 회원 가입을 승인하시겠습니까?\n승인 시 해당 업체의 기본 업소 정보가 자동 생성됩니다.')) {
      setUsers(prev => {
        const next = prev.map(u => u.id === id ? { ...u, status: 'approved' } : u);
        const approvedUser = next.find(u => u.id === id);
        
        if (approvedUser) {
          // custom_users에 저장
          const customUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
          const uIdx = customUsers.findIndex((u: any) => u.id === id);
          if (uIdx >= 0) customUsers[uIdx] = approvedUser;
          else customUsers.push(approvedUser);
          localStorage.setItem('custom_users', JSON.stringify(customUsers));

          // 현재 로그인한 유저가 본인이면 auth_user도 업데이트
          try {
            const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
            if (authUser.id === id) {
              authUser.status = 'approved';
              localStorage.setItem('auth_user', JSON.stringify(authUser));
            }
          } catch {}

          // 업소 자동 생성 로직 추가
          const newShopId = `shop-auto-${Date.now()}`;
          const newShop = {
            id: newShopId,
            name: approvedUser.businessName || '신규 업소',
            slug: newShopId,
            region: 'seoul',
            regionLabel: '서울',
            subRegion: '',
            subRegionLabel: '',
            theme: 'massage',
            themeLabel: '마사지',
            isPremium: false,
            thumbnailUrl: '',
            bannerUrl: '',
            images: [],
            tagline: '신규 가입 업소입니다.',
            description: '내용을 입력해주세요.',
            address: '주소를 입력해주세요',
            phone: approvedUser.phone || '',
            hours: '영업시간을 입력해주세요',
            rating: 0,
            reviewCount: 0,
            courses: [],
            tags: [],
            isVisible: true,
            approvalStatus: 'approved',
            ownerId: id,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          };

          // custom_shops에 저장
          const customShops = JSON.parse(localStorage.getItem('custom_shops') || '[]');
          if (!customShops.some((s: any) => s.id === newShopId)) {
            customShops.push(newShop);
            localStorage.setItem('custom_shops', JSON.stringify(customShops));
          }

          // state 반영
          setShops(prevShops => {
            if (prevShops.some(s => s.id === newShopId)) return prevShops;
            return [...prevShops, newShop as Shop];
          });
        }
        return next;
      });
    }
  };

  const handleRejectOwner = (id: string) => {
    if (confirm('입점사 회원 가입을 반려하시겠습니까?')) {
      setUsers(prev => {
        const next = prev.map(u => u.id === id ? { ...u, status: 'rejected' } : u);
        const rejectedUser = next.find(u => u.id === id);
        if (rejectedUser) {
          const customUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
          const uIdx = customUsers.findIndex((u: any) => u.id === id);
          if (uIdx >= 0) customUsers[uIdx] = rejectedUser;
          else customUsers.push(rejectedUser);
          localStorage.setItem('custom_users', JSON.stringify(customUsers));

          try {
            const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
            if (authUser.id === id) {
              authUser.status = 'rejected';
              localStorage.setItem('auth_user', JSON.stringify(authUser));
            }
          } catch {}
        }
        return next;
      });
    }
  };

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Store className="w-5 h-5 text-red-600" /> 입점 및 회원 승인 관리
        </h1>
        <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex gap-3">
          <span>가입 대기: {pendingOwners.length}건</span>
          <span className="text-gray-300">|</span>
          <span>업소 대기: {pendingShops.length}건</span>
        </div>
      </div>

      {/* 입점사 회원가입 승인 대기 목록 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" /> 대기 중인 입점사 회원가입 ({pendingOwners.length})
        </h2>
        
        {pendingOwners.length === 0 ? (
          <div className="text-center py-8 text-gray-500">대기 중인 회원가입 요청이 없습니다.</div>
        ) : (
          <div className="grid gap-4">
            {pendingOwners.map(user => (
              <div key={user.id} className="border border-blue-100 bg-blue-50/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-gray-800">{user.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">가입승인대기</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5"/> 업체명: {user.businessName}</div>
                    <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> 사업자번호: {user.businessNumber}</div>
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> 연락처: {user.phone}</div>
                    <div className="flex items-center gap-1.5">이메일: {user.email}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveOwner(user.id)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold text-sm transition-colors">
                    <Check className="w-4 h-4"/> 가입승인
                  </button>
                  <button onClick={() => handleRejectOwner(user.id)} className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-bold text-sm transition-colors">
                    <X className="w-4 h-4"/> 반려
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 업소 등록 승인 대기 목록 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <Store className="w-5 h-5 text-red-500" /> 대기 중인 업소 등록 요청 ({pendingShops.length})
        </h2>
        
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

      {/* 최근 처리 내역 - 통합 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">최근 처리 내역</h2>
        {processedShops.length === 0 && processedOwners.length === 0 ? (
          <div className="text-center py-8 text-gray-500">처리 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-bold text-center">유형</th>
                  <th className="px-4 py-2 font-bold text-center">상태</th>
                  <th className="px-4 py-2 font-bold">이름/업소명</th>
                  <th className="px-4 py-2 font-bold">상세정보</th>
                  <th className="px-4 py-2 font-bold">연락처</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedOwners.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center text-xs text-blue-600 font-bold">회원가입</td>
                    <td className="px-4 py-2 text-center">
                      <span className={clsx("px-2 py-1 text-xs rounded-full font-bold", 
                        user.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {user.status === 'approved' ? '승인완료' : '반려됨'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-bold text-gray-800">{user.name} ({user.businessName})</td>
                    <td className="px-4 py-2 text-gray-500">사업자: {user.businessNumber}</td>
                    <td className="px-4 py-2 text-gray-500">{user.phone}</td>
                  </tr>
                ))}
                {processedShops.map((shop, idx) => (
                  <tr key={`shop-${shop.id}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center text-xs text-red-600 font-bold">업소등록</td>
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
