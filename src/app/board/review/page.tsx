'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight, PenLine, Search, Star, X } from 'lucide-react';
import type { Review, Shop, User } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type ReviewWithRegion = Review & { region: string; regionLabel: string };

type ShopListResponse = {
  allShops?: Shop[];
};

type SessionResponse = {
  user?: User | null;
};

function StarRow({ rating, className = 'h-3 w-3' }: { rating: number; className?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((score) => (
        <Star
          key={score}
          className={`${className} ${score <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

function StarSelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          onMouseEnter={() => setHovered(score)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(score)}
          aria-label={`${score}점 선택`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${score <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialShopId = searchParams.get('shopId') ?? '';
  const initialKeyword = searchParams.get('q') ?? '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reviews, setReviews] = useState<ReviewWithRegion[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialKeyword);
  const [searchType, setSearchType] = useState<'all' | 'shop' | 'author' | 'content'>('all');
  const [regionTab, setRegionTab] = useState('all');
  const [shopTab, setShopTab] = useState(initialShopId || 'all');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ shopId: initialShopId, authorName: '', rating: 5, content: '' });

  useEffect(() => {
    setSearchQuery(initialKeyword);
    setShopTab(initialShopId || 'all');
    setForm((current) => ({ ...current, shopId: initialShopId }));
  }, [initialKeyword, initialShopId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [meResponse, reviewResponse, shopResponse] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch('/api/board/reviews', { cache: 'no-store' }),
          fetch('/api/shops', { cache: 'no-store' }),
        ]);

        if (meResponse.ok) {
          const meResult = (await meResponse.json()) as SessionResponse;
          setUser(meResult.user ?? null);
        } else {
          setUser(null);
        }

        const reviewResult = (await reviewResponse.json()) as { reviews?: Review[]; error?: string };
        const shopResult = (await shopResponse.json()) as ShopListResponse;

        if (!reviewResponse.ok || !reviewResult.reviews) {
          throw new Error(reviewResult.error ?? '리뷰 목록을 불러오지 못했습니다.');
        }

        const allShops = Array.isArray(shopResult.allShops) ? shopResult.allShops : [];
        const shopMap = new Map(allShops.map((shop) => [shop.id, shop]));

        setShops(allShops);
        setReviews(
          reviewResult.reviews.map((review) => {
            const matchedShop = shopMap.get(review.shopId);
            return {
              ...review,
              region: matchedShop?.region ?? '',
              regionLabel: matchedShop?.regionLabel ?? '',
            };
          }),
        );
      } catch (loadError) {
        setUser(null);
        setError(loadError instanceof Error ? loadError.message : '리뷰 목록을 불러오지 못했습니다.');
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!shops.length) {
      return;
    }

    if (shopTab === 'all') {
      if (!initialShopId) {
        setRegionTab('all');
      }
      return;
    }

    const selectedShop = shops.find((shop) => shop.id === shopTab);
    if (selectedShop?.region) {
      setRegionTab(selectedShop.region);
    }
  }, [initialShopId, shopTab, shops]);

  useEffect(() => {
    if (!shops.length || !initialShopId) {
      return;
    }

    const initialShop = shops.find((shop) => shop.id === initialShopId);
    if (initialShop?.region) {
      setRegionTab(initialShop.region);
    }
  }, [initialShopId, shops]);

  const regionList = useMemo(
    () => [
      { code: 'all', label: '전체' },
      ...Array.from(new Map(shops.map((shop) => [shop.region, shop.regionLabel])).entries())
        .filter(([code, label]) => code && label)
        .map(([code, label]) => ({ code, label })),
    ],
    [shops],
  );

  const filteredShopList = useMemo(
    () => [
      { id: 'all', label: '전체 업체' },
      ...shops
        .filter((shop) => regionTab === 'all' || shop.region === regionTab)
        .map((shop) => ({ id: shop.id, label: shop.name })),
    ],
    [regionTab, shops],
  );

  const shopSelectList = useMemo(
    () => [{ id: '', label: '업체 선택' }, ...shops.map((shop) => ({ id: shop.id, label: shop.name }))],
    [shops],
  );

  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reviews.filter((review) => {
      if (regionTab !== 'all' && review.region !== regionTab) {
        return false;
      }

      if (shopTab !== 'all' && review.shopId !== shopTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      if (searchType === 'shop') {
        return review.shopName.toLowerCase().includes(query);
      }

      if (searchType === 'author') {
        return review.authorName.toLowerCase().includes(query);
      }

      if (searchType === 'content') {
        return review.content.toLowerCase().includes(query);
      }

      return [review.shopName, review.authorName, review.content].some((value) => value.toLowerCase().includes(query));
    });
  }, [regionTab, reviews, searchQuery, searchType, shopTab]);

  function handleRegionTab(code: string) {
    setRegionTab(code);
    setShopTab('all');
  }

  function handleOpenModal() {
    setSubmitted(false);
    setError(null);
    if (!user) {
      setShowModal(true);
      return;
    }

    setForm((current) => ({
      ...current,
      shopId: current.shopId || (shopTab !== 'all' ? shopTab : initialShopId),
      authorName: user.name,
    }));
    setShowModal(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.shopId) {
      setError('업체를 선택해주세요.');
      return;
    }

    if (!user) {
      setError('로그인한 회원만 후기를 작성할 수 있습니다.');
      return;
    }

    if (!form.content.trim()) {
      setError('후기 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitted(false);

    try {
      const response = await fetch('/api/board/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: form.shopId,
          rating: form.rating,
          content: form.content,
        }),
      });

      const result = (await response.json()) as { review?: Review; error?: string };
      const createdReview = result.review;
      if (!response.ok || !createdReview) {
        throw new Error(result.error ?? '리뷰를 등록하지 못했습니다.');
      }

      const matchedShop = shops.find((shop) => shop.id === createdReview.shopId);
      setReviews((current) => [
        {
          ...createdReview,
          region: matchedShop?.region ?? '',
          regionLabel: matchedShop?.regionLabel ?? '',
        },
        ...current,
      ]);
      setForm({ shopId: initialShopId || '', authorName: user.name, rating: 5, content: '' });
      setSubmitted(true);
      setShowModal(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '리뷰를 등록하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[800px] px-3 py-4">
      <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
        <Link href="/" className="hover:text-red-600">
          홈
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/board" className="hover:text-red-600">
          게시판
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800">업소 후기</span>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-black text-gray-800">⭐ 업소 후기 모아보기</h1>
        <button
          type="button"
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700"
        >
          <PenLine className="h-3.5 w-3.5" />
          후기 작성
        </button>
      </div>

      <div className="mb-3 flex gap-1.5">
        <select
          value={searchType}
          onChange={(event) => setSearchType(event.target.value as typeof searchType)}
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:border-red-500 focus:outline-none"
        >
          <option value="all">전체</option>
          <option value="shop">업체명</option>
          <option value="author">작성자</option>
          <option value="content">내용</option>
        </select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={{
              all: '업체명 / 작성자 / 내용 검색',
              shop: '업체명으로 검색',
              author: '작성자명으로 검색',
              content: '내용으로 검색',
            }[searchType]}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-9 text-sm focus:border-red-500 focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="검색어 초기화"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
        {regionList.map((region) => (
          <button
            key={region.code}
            type="button"
            onClick={() => handleRegionTab(region.code)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              regionTab === region.code
                ? 'border-red-600 bg-red-600 text-white'
                : 'border-gray-300 bg-white text-gray-600 hover:border-red-400'
            }`}
          >
            {region.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {filteredShopList.map((shop) => (
          <button
            key={shop.id}
            type="button"
            onClick={() => setShopTab(shop.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              shopTab === shop.id
                ? 'border-gray-800 bg-gray-800 text-white'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-500'
            }`}
          >
            {shop.label}
          </button>
        ))}
      </div>

      {submitted ? (
        <div className="mb-3 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">리뷰가 등록되었습니다.</div>
      ) : null}
      {error ? <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">리뷰를 불러오는 중입니다.</div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">해당 조건의 후기가 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-3">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{review.authorName}</span>
                    <span className="text-xs text-red-500">{review.shopName}</span>
                    {review.regionLabel ? (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-400">{review.regionLabel}</span>
                    ) : null}
                    <StarRow rating={review.rating} />
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">{review.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 text-right text-xs text-gray-400">총 {filteredReviews.length}개 후기</div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-black text-gray-800">{user ? '후기 작성' : '로그인 안내'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!authChecked ? null : !user ? (
              <div className="space-y-4 p-5 text-center">
                <p className="text-sm font-bold text-gray-800">후기 작성은 로그인한 회원만 가능합니다.</p>
                <p className="text-xs leading-relaxed text-gray-500">
                  기존 후기 목록은 계속 둘러볼 수 있고, 로그인 후 같은 화면에서 바로 후기를 남길 수 있습니다.
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/auth/login?redirect=${encodeURIComponent(`${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)}`}
                    className="flex-1 rounded-lg bg-red-600 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-red-700"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex-1 rounded-lg border border-gray-300 py-2.5 text-center text-sm font-bold text-gray-700 transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    회원가입
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-600">
                    업체 선택 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.shopId}
                    onChange={(event) => setForm((current) => ({ ...current, shopId: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  >
                    {shopSelectList.map((shop) => (
                      <option key={shop.id} value={shop.id} disabled={shop.id === ''}>
                        {shop.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-600">
                    작성자 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 focus:outline-none"
                  />
                </div>

                <div>
                  <p className="mb-1 text-xs font-bold text-gray-600">별점</p>
                  <StarSelector value={form.rating} onChange={(value) => setForm((current) => ({ ...current, rating: value }))} />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-600">
                    후기 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="방문 후기를 자유롭게 작성해주세요."
                    value={form.content}
                    onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? '등록 중' : '등록'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ReviewContent />
    </Suspense>
  );
}
