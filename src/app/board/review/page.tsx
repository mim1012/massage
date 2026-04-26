'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, PenLine, Search, Star, X } from 'lucide-react';
import type { Review, Shop, User } from '@/lib/types';
import { formatDate } from '@/lib/utils';

function getRoleLabel(role: User['role']) {
  switch (role) {
    case 'ADMIN':
      return '관리자';
    case 'OWNER':
      return '업주';
    case 'USER':
    default:
      return '회원';
  }
}

type ReviewWithRegion = Review & { region: string; regionLabel: string };

type ShopListResponse = {
  allShops?: Shop[];
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
          className="rounded-sm"
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
  const router = useRouter();
  const pathname = usePathname();

  const shopId = searchParams.get('shopId');
  const initialKeyword = searchParams.get('q') ?? '';

  const [keyword, setKeyword] = useState(initialKeyword);
  const [searchType, setSearchType] = useState<'all' | 'shop' | 'author' | 'content'>('all');
  const [regionTab, setRegionTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewWithRegion[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ rating: 5, content: '' });

  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const meResponse = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!meResponse.ok) {
          setUser(null);
          setReviews([]);
          setShops([]);
          return;
        }

        const meResult = (await meResponse.json()) as { user?: User };
        const nextUser = meResult.user ?? null;
        setUser(nextUser);

        if (!nextUser) {
          setReviews([]);
          setShops([]);
          return;
        }

        const reviewQuery = new URLSearchParams();
        if (shopId) reviewQuery.set('shopId', shopId);
        if (initialKeyword.trim()) reviewQuery.set('q', initialKeyword.trim());

        const [reviewResponse, shopResponse] = await Promise.all([
          fetch(`/api/board/reviews${reviewQuery.toString() ? `?${reviewQuery.toString()}` : ''}`, { cache: 'no-store' }),
          fetch('/api/shops', { cache: 'no-store' }),
        ]);

        const reviewResult = (await reviewResponse.json()) as { reviews?: Review[]; error?: string };
        if (!reviewResponse.ok || !reviewResult.reviews) {
          throw new Error(reviewResult.error ?? '리뷰 목록을 불러오지 못했습니다.');
        }

        const shopResult = (await shopResponse.json()) as ShopListResponse;
        const allShops = Array.isArray(shopResult.allShops) ? shopResult.allShops : [];
        const shopMap = new Map(allShops.map((entry) => [entry.id, entry]));

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
        setError(loadError instanceof Error ? loadError.message : '리뷰 목록을 불러오지 못했습니다.');
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    void load();
  }, [initialKeyword, shopId]);

  useEffect(() => {
    if (!shops.length) {
      setRegionTab('all');
      return;
    }

    if (!shopId) {
      setRegionTab('all');
      return;
    }

    const selectedShop = shops.find((entry) => entry.id === shopId);
    setRegionTab(selectedShop?.region ?? 'all');
  }, [shopId, shops]);

  const regionList = useMemo(
    () => [
      { code: 'all', label: '전체' },
      ...Array.from(new Map(shops.map((entry) => [entry.region, entry.regionLabel])).entries()).map(([code, label]) => ({
        code,
        label,
      })),
    ],
    [shops],
  );

  const filteredShopList = useMemo(
    () => [
      { id: 'all', label: '전체 업체' },
      ...shops
        .filter((entry) => regionTab === 'all' || entry.region === regionTab)
        .map((entry) => ({ id: entry.id, label: entry.name })),
    ],
    [regionTab, shops],
  );

  const filteredReviews = useMemo(() => {
    const query = initialKeyword.trim().toLowerCase();

    return reviews.filter((review) => {
      if (regionTab !== 'all' && review.region !== regionTab) {
        return false;
      }

      if (shopId && review.shopId !== shopId) {
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

      return [review.authorName, review.shopName, review.content].some((value) => value.toLowerCase().includes(query));
    });
  }, [initialKeyword, regionTab, reviews, searchType, shopId]);

  function replaceParams(next: { keyword?: string; nextShopId?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.keyword !== undefined) {
      const trimmedKeyword = next.keyword.trim();
      if (trimmedKeyword) {
        params.set('q', trimmedKeyword);
      } else {
        params.delete('q');
      }
    }

    if (next.nextShopId !== undefined) {
      if (next.nextShopId) {
        params.set('shopId', next.nextShopId);
      } else {
        params.delete('shopId');
      }
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    replaceParams({ keyword });
  }

  function handleSearchReset() {
    setKeyword('');
    replaceParams({ keyword: '' });
  }

  function handleRegionTab(code: string) {
    setRegionTab(code);

    if (code === 'all') {
      replaceParams({ nextShopId: null });
      return;
    }

    const selectedShop = shopId ? shops.find((entry) => entry.id === shopId) : null;
    if (selectedShop && selectedShop.region === code) {
      return;
    }

    replaceParams({ nextShopId: null });
  }

  function handleShopTab(nextShopId: string) {
    replaceParams({ nextShopId: nextShopId === 'all' ? null : nextShopId });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setError('로그인한 회원만 리뷰를 작성할 수 있습니다.');
      return;
    }

    if (!shopId) {
      setError('업소 상세 페이지에서 리뷰를 작성해 주세요.');
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
          shopId,
          rating: form.rating,
          content: form.content,
        }),
      });
      const result = (await response.json()) as { review?: Review; error?: string };
      const createdReview = result.review;
      if (!response.ok || !createdReview) {
        throw new Error(result.error ?? '리뷰를 등록하지 못했습니다.');
      }

      const matchedShop = shops.find((entry) => entry.id === createdReview.shopId);
      setReviews((current) => [
        {
          ...createdReview,
          region: matchedShop?.region ?? '',
          regionLabel: matchedShop?.regionLabel ?? '',
        },
        ...current,
      ]);
      setForm({ rating: 5, content: '' });
      setSubmitted(true);
      setShowModal(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '리뷰를 등록하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedShop = shopId ? shops.find((entry) => entry.id === shopId) ?? null : null;

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

      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-lg font-black text-gray-800">⭐ 업소 후기 모아보기</h1>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          disabled={!user || !shopId}
          className="flex shrink-0 items-center gap-1.5 rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PenLine className="h-3.5 w-3.5" />
          후기 작성
        </button>
      </div>

      {!authChecked || loading ? (
        <div className="rounded border border-gray-200 bg-white py-10 text-center text-sm text-gray-400">
          리뷰를 불러오는 중입니다.
        </div>
      ) : !user ? (
        <div className="space-y-3 rounded border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm font-bold text-gray-800">리뷰는 로그인한 회원만 읽고 작성할 수 있습니다.</p>
          <p className="text-xs text-gray-500">로그인 후 이용 후기를 확인하고 직접 후기를 남겨보세요.</p>
          <div className="flex justify-center gap-2">
            <Link href="/auth/login" className="rounded bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
              로그인
            </Link>
            <Link
              href="/auth/register"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:border-red-300 hover:text-red-600"
            >
              회원가입
            </Link>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleSearchSubmit} className="mb-3 flex gap-1.5">
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
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-9 text-sm focus:border-red-500 focus:outline-none"
              />
              {keyword ? (
                <button
                  type="button"
                  onClick={handleSearchReset}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="검색어 초기화"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </form>

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
                onClick={() => handleShopTab(shop.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  (shop.id === 'all' ? !shopId : shopId === shop.id)
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
          {!shopId ? (
            <div className="mb-3 rounded border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              후기 작성은 업소 상세 페이지에서만 가능합니다.
            </div>
          ) : null}

          <div className="overflow-hidden rounded border border-gray-200 bg-white">
            {filteredReviews.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                {initialKeyword ? '검색 조건에 맞는 리뷰가 없습니다.' : '해당 조건의 후기가 없습니다.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="p-3">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
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

          <div className="mt-2 text-right text-xs text-gray-400">
            총 {filteredReviews.length}개 후기
            {initialKeyword ? <span> · “{initialKeyword}” 검색 결과</span> : null}
          </div>

          {showModal ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <h2 className="font-black text-gray-800">후기 작성</h2>
                  <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                  <div>
                    <p className="mb-1 text-xs font-bold text-gray-600">
                      업체 선택 <span className="text-red-500">*</span>
                    </p>
                    <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {selectedShop?.name ?? '업소 상세 페이지에서 선택해 주세요.'}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-bold text-gray-600">작성자</p>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <span>{user.name}</span>
                      <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
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
                      required
                      rows={4}
                      placeholder={shopId ? '방문 후기를 자유롭게 작성해주세요.' : '업소 상세 페이지에서 리뷰를 작성해주세요.'}
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
                      disabled={submitting || !shopId}
                      className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? '등록 중' : '등록'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </>
      )}
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
