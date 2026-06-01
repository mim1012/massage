'use client';

import { useState, useEffect } from 'react';
import { Star, Trash2, EyeOff, Eye, MessageSquare } from 'lucide-react';
import { MOCK_REVIEWS, MOCK_SHOPS, MOCK_USERS } from '@/lib/mockData';
import { Review } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import clsx from 'clsx';

const shopMap = Object.fromEntries(MOCK_SHOPS.map(s => [s.id, s]));

type ManagedReview = Review & { isHidden?: boolean };

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ManagedReview[]>(
    MOCK_REVIEWS.map(r => ({ ...r, isHidden: false }))
  );
  const [currentUser, setCurrentUser] = useState(MOCK_USERS[0]);
  const [filterShop, setFilterShop] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'visible' | 'hidden'>('all');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === 'OWNER') setCurrentUser(MOCK_USERS[1]);
      }
    } catch {}
  }, []);

  // OWNER는 자신의 업소 후기만
  const myShopId = currentUser.role === 'OWNER' ? currentUser.managedShopId : null;

  const visibleReviews = reviews.filter(r => {
    if (myShopId && r.shopId !== myShopId) return false;
    if (filterShop !== 'all' && r.shopId !== filterShop) return false;
    if (filterStatus === 'visible' && r.isHidden) return false;
    if (filterStatus === 'hidden' && !r.isHidden) return false;
    return true;
  });

  // 내가 관리할 수 있는 업체 목록
  const myShops = currentUser.role === 'ADMIN'
    ? MOCK_SHOPS
    : MOCK_SHOPS.filter(s => s.id === myShopId);

  const toggleHidden = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isHidden: !r.isHidden } : r));
  };

  const deleteReview = (id: string) => {
    if (!confirm('이 후기를 삭제하시겠습니까?')) return;
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const hiddenCount = reviews.filter(r => myShopId ? r.shopId === myShopId && r.isHidden : r.isHidden).length;
  const totalCount = reviews.filter(r => myShopId ? r.shopId === myShopId : true).length;

  return (
    <div className="max-w-[900px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-red-600" />
          {currentUser.role === 'ADMIN' ? '후기 전체 관리' : '내 업소 후기 관리'}
        </h1>
        <div className="flex gap-2 text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded">전체 {totalCount}개</span>
          <span className="bg-red-50 text-red-600 px-2 py-1 rounded">숨김 {hiddenCount}개</span>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 border border-gray-200 rounded">
        {currentUser.role === 'ADMIN' && (
          <select
            value={filterShop}
            onChange={e => setFilterShop(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-red-500 outline-none"
          >
            <option value="all">전체 업체</option>
            {myShops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as 'all' | 'visible' | 'hidden')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-red-500 outline-none"
        >
          <option value="all">전체 상태</option>
          <option value="visible">노출 중</option>
          <option value="hidden">숨김 처리</option>
        </select>
      </div>

      {/* 후기 목록 */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden divide-y divide-gray-100">
        {visibleReviews.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">해당 조건의 후기가 없습니다.</div>
        ) : (
          visibleReviews.map(review => {
            const shop = shopMap[review.shopId];
            return (
              <div key={review.id} className={clsx('p-3 flex gap-3 items-start', review.isHidden && 'bg-gray-50 opacity-60')}>
                {/* 후기 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm text-gray-800">{review.authorName}</span>
                    <span className="text-xs text-red-500 font-medium">{review.shopName}</span>
                    {shop?.regionLabel && (
                      <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{shop.regionLabel}</span>
                    )}
                    <StarRow rating={review.rating} />
                    {review.isHidden && (
                      <span className="text-[11px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-bold">숨김</span>
                    )}
                    <span className="text-[11px] text-gray-400 ml-auto">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleHidden(review.id)}
                    title={review.isHidden ? '노출로 변경' : '숨김 처리'}
                    className={clsx(
                      'p-1.5 rounded border text-xs transition-colors',
                      review.isHidden
                        ? 'border-green-300 text-green-600 hover:bg-green-50'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                    )}
                  >
                    {review.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteReview(review.id)}
                    title="삭제"
                    className="p-1.5 rounded border border-red-200 text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
