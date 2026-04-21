'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Search, Star, X } from 'lucide-react';
import type { Review, User } from '@/lib/types';
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

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shopId = searchParams.get('shopId');
  const initialKeyword = searchParams.get('q') ?? '';
  const [keyword, setKeyword] = useState(initialKeyword);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
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
          return;
        }

        const meResult = (await meResponse.json()) as { user?: User };
        const nextUser = meResult.user ?? null;
        setUser(nextUser);

        if (!nextUser) {
          setReviews([]);
          return;
        }

        const query = new URLSearchParams();
        if (shopId) query.set('shopId', shopId);
        if (initialKeyword.trim()) query.set('q', initialKeyword.trim());
        const reviewResponse = await fetch(`/api/board/reviews${query.toString() ? `?${query.toString()}` : ''}`, {
          cache: 'no-store',
        });
        const reviewResult = (await reviewResponse.json()) as { reviews?: Review[]; error?: string };
        if (!reviewResponse.ok || !reviewResult.reviews) {
          throw new Error(reviewResult.error ?? '리뷰 목록을 불러오지 못했습니다.');
        }

        setReviews(reviewResult.reviews);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '리뷰 목록을 불러오지 못했습니다.');
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    void load();
  }, [initialKeyword, shopId]);

  const filteredReviews = useMemo(() => {
    const query = initialKeyword.trim().toLowerCase();

    return reviews.filter((review) => {
      if (shopId && review.shopId !== shopId) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [review.authorName, review.shopName, review.content].some((value) => value.toLowerCase().includes(query));
    });
  }, [initialKeyword, reviews, shopId]);

  function updateQuery(nextKeyword: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = nextKeyword.trim();

    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery(keyword);
  }

  function handleSearchReset() {
    setKeyword('');
    updateQuery('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setError('로그인한 회원만 리뷰를 작성할 수 있습니다.');
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

      setReviews((current) => [createdReview, ...current]);
      setForm({ rating: 5, content: '' });
      setSubmitted(true);
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
        <span className="text-gray-800">이용 후기</span>
      </div>
      <h1 className="mb-3 text-lg font-black text-gray-800">업소 후기</h1>

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
            <Link href="/auth/register" className="rounded border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:border-red-300 hover:text-red-600">
              회원가입
            </Link>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded border border-red-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-800">리뷰 작성</p>
                <p className="text-xs text-gray-500">
                  작성자: {user.name}
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">{getRoleLabel(user.role)}</span>
                </p>
              </div>
              <select
                value={form.rating}
                onChange={(event) => setForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-red-500"
              >
                {[5, 4, 3, 2, 1].map((score) => (
                  <option key={score} value={score}>
                    {score}점
                  </option>
                ))}
              </select>
            </div>
            <textarea
              required
              rows={4}
              value={form.content}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              placeholder={shopId ? '이 업소 이용 후기를 입력해 주세요.' : '이용 후기를 입력해 주세요.'}
              className="w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={submitting || !shopId}
              className="w-full rounded bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!shopId ? '업소 상세에서 작성할 수 있습니다' : submitting ? '등록 중' : '리뷰 등록'}
            </button>
            <p className="text-[11px] text-gray-400">일반 회원, 업주, 관리자 로그인 모두 리뷰 작성이 가능합니다.</p>
          </form>

          {submitted ? (
            <div className="mb-3 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">리뷰가 등록되었습니다.</div>
          ) : null}
          {error ? <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}

          <form onSubmit={handleSearchSubmit} className="mb-3 rounded border border-gray-200 bg-white p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="작성자, 업소명, 내용으로 검색"
                  className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-red-500"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded bg-gray-800 px-4 py-2 text-sm font-bold text-white hover:bg-black"
                >
                  검색
                </button>
                {initialKeyword ? (
                  <button
                    type="button"
                    onClick={handleSearchReset}
                    className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-2 text-sm font-bold text-gray-600 hover:border-red-300 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                    초기화
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              총 {filteredReviews.length}개의 리뷰
              {initialKeyword ? <span> · “{initialKeyword}” 검색 결과</span> : null}
            </p>
          </form>

          <div className="divide-y divide-gray-100 overflow-hidden rounded border border-gray-200 bg-white">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-bold text-gray-800">{review.authorName}</span>
                    <span className="truncate text-xs text-red-500">{review.shopName}</span>
                    <div className="flex shrink-0 gap-0.5">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Star
                          key={score}
                          className={`h-3 w-3 ${score <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">{review.content}</p>
              </div>
            ))}
            {filteredReviews.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                {initialKeyword ? '검색 조건에 맞는 리뷰가 없습니다.' : '등록된 리뷰가 아직 없습니다.'}
              </div>
            ) : null}
          </div>
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
