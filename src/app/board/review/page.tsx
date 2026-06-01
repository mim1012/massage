'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, ChevronRight, PenLine, X, Search } from 'lucide-react';
import { MOCK_REVIEWS, MOCK_SHOPS } from '@/lib/mockData';
import { Review } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const shopMap = Object.fromEntries(MOCK_SHOPS.map(s => [s.id, s]));

type ReviewWithRegion = Review & { region: string; regionLabel: string };

function enrichReviews(list: Review[]): ReviewWithRegion[] {
  return list.map(r => ({
    ...r,
    region: shopMap[r.shopId]?.region ?? '',
    regionLabel: shopMap[r.shopId]?.regionLabel ?? '',
  }));
}

const regionList = [
  { code: 'all', label: '전체' },
  ...Array.from(new Map(
    enrichReviews(MOCK_REVIEWS).filter(r => r.regionLabel).map(r => [r.region, r.regionLabel])
  ).entries()).map(([code, label]) => ({ code, label })),
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        >
          <Star className={`w-6 h-6 transition-colors ${i <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<ReviewWithRegion[]>(enrichReviews(MOCK_REVIEWS));
  const [regionTab, setRegionTab] = useState('all');
  const [shopTab, setShopTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all'|'shop'|'author'|'content'>('all');

  // 폼 상태
  const [form, setForm] = useState({ shopId: '', authorName: '', rating: 5, content: '' });
  const [submitting, setSubmitting] = useState(false);

  const shopList = [
    { id: '', label: '업체 선택' },
    ...MOCK_SHOPS.map(s => ({ id: s.id, label: s.name })),
  ];

  const filtered = reviews.filter(r => {
    const matchRegion = regionTab === 'all' || r.region === regionTab;
    const matchShop = shopTab === 'all' || r.shopId === shopTab;
    const q = searchQuery.trim().toLowerCase();
    let matchSearch = true;
    if (q) {
      if (searchType === 'shop')    matchSearch = r.shopName.toLowerCase().includes(q);
      else if (searchType === 'author')  matchSearch = r.authorName.toLowerCase().includes(q);
      else if (searchType === 'content') matchSearch = r.content.toLowerCase().includes(q);
      else matchSearch =
        r.shopName.toLowerCase().includes(q) ||
        r.authorName.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q);
    }
    return matchRegion && matchShop && matchSearch;
  });

  const handleRegionTab = (code: string) => {
    setRegionTab(code);
    setShopTab('all');
  };

  const filteredShopList = [
    { id: 'all', label: '전체 업체' },
    ...MOCK_SHOPS
      .filter(s => regionTab === 'all' || s.region === regionTab)
      .map(s => ({ id: s.id, label: s.name })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopId) return alert('업체를 선택해주세요.');
    if (!form.authorName.trim()) return alert('작성자 이름을 입력해주세요.');
    if (!form.content.trim()) return alert('후기 내용을 입력해주세요.');

    setSubmitting(true);
    const shop = shopMap[form.shopId];
    const newReview: ReviewWithRegion = {
      id: `review-${Date.now()}`,
      shopId: form.shopId,
      shopName: shop?.name ?? '',
      authorName: form.authorName,
      rating: form.rating,
      content: form.content,
      createdAt: new Date().toISOString().slice(0, 10),
      region: shop?.region ?? '',
      regionLabel: shop?.regionLabel ?? '',
    };

    setReviews(prev => [newReview, ...prev]);
    setForm({ shopId: '', authorName: '', rating: 5, content: '' });
    setShowModal(false);
    setSubmitting(false);
  };

  return (
    <div className="max-w-[800px] mx-auto px-3 py-4">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link href="/" className="hover:text-red-600">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/board" className="hover:text-red-600">게시판</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800">업소 후기</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-black text-gray-800">⭐ 업소 후기 모아보기</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
        >
          <PenLine className="w-3.5 h-3.5" />
          후기 작성
        </button>
      </div>

      {/* 검색 */}
      <div className="flex gap-1.5 mb-3">
        <select
          value={searchType}
          onChange={e => setSearchType(e.target.value as typeof searchType)}
          className="shrink-0 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 bg-white"
        >
          <option value="all">전체</option>
          <option value="shop">업체명</option>
          <option value="author">작성자</option>
          <option value="content">내용</option>
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={{
              all: '업체명 / 작성자 / 내용 검색',
              shop: '업체명으로 검색',
              author: '작성자명으로 검색',
              content: '내용으로 검색',
            }[searchType]}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 지역 탭 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2 scrollbar-hide">
        {regionList.map(r => (
          <button
            key={r.code}
            onClick={() => handleRegionTab(r.code)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              regionTab === r.code
                ? 'bg-red-600 text-white border-red-600'
                : 'border-gray-300 text-gray-600 bg-white hover:border-red-400'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* 업체 탭 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-hide">
        {filteredShopList.map(s => (
          <button
            key={s.id}
            onClick={() => setShopTab(s.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              shopTab === s.id
                ? 'bg-gray-800 text-white border-gray-800'
                : 'border-gray-300 text-gray-600 bg-white hover:border-gray-500'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 후기 목록 */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">해당 조건의 후기가 없습니다.</div>
        ) : (
          filtered.map(review => (
            <div key={review.id} className="p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-gray-800">{review.authorName}</span>
                  <span className="text-xs text-red-500">{review.shopName}</span>
                  {review.regionLabel && (
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{review.regionLabel}</span>
                  )}
                  <StarRow rating={review.rating} />
                </div>
                <span className="text-[11px] text-gray-400 shrink-0">{formatDate(review.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-2 text-xs text-gray-400 text-right">총 {filtered.length}개 후기</div>

      {/* 글쓰기 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-black text-gray-800">후기 작성</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* 업체 선택 */}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">업체 선택 <span className="text-red-500">*</span></label>
                <select
                  value={form.shopId}
                  onChange={e => setForm(prev => ({ ...prev, shopId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                >
                  {shopList.map(s => (
                    <option key={s.id} value={s.id} disabled={s.id === ''}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* 작성자 */}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">작성자 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="홍**"
                  value={form.authorName}
                  onChange={e => setForm(prev => ({ ...prev, authorName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              {/* 별점 */}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">별점</label>
                <StarSelector value={form.rating} onChange={v => setForm(prev => ({ ...prev, rating: v }))} />
              </div>

              {/* 내용 */}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">후기 내용 <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  placeholder="방문 후기를 자유롭게 작성해주세요."
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-sm transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
