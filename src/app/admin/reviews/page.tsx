'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Search, Star, Trash2 } from 'lucide-react';
import type { Review } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import clsx from 'clsx';

type ManagedReview = Review & { shopRegionLabel?: string };

const RATING_OPTIONS = [
  { value: 'all', label: '전체 평점' },
  { value: '5', label: '5점' },
  { value: '4', label: '4점' },
  { value: '3', label: '3점' },
  { value: '2', label: '2점' },
  { value: '1', label: '1점' },
] as const;

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((score) => (
        <Star
          key={score}
          className={clsx('h-3 w-3', score <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ManagedReview[]>([]);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/reviews', { cache: 'no-store' });
        const result = (await response.json()) as { reviews?: ManagedReview[]; error?: string };

        if (!response.ok || !result.reviews) {
          throw new Error(result.error ?? '리뷰 목록을 불러오지 못했습니다.');
        }

        setReviews(result.reviews);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '리뷰 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  async function removeReview(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? '리뷰를 삭제하지 못했습니다.');
      }

      setReviews((current) => current.filter((review) => review.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '리뷰를 삭제하지 못했습니다.');
    } finally {
      setDeletingId(null);
    }
  }

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesRating = ratingFilter === 'all' || review.rating === Number(ratingFilter);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        review.authorName.toLowerCase().includes(normalizedSearch) ||
        review.shopName.toLowerCase().includes(normalizedSearch) ||
        review.content.toLowerCase().includes(normalizedSearch) ||
        (review.shopRegionLabel ?? '').toLowerCase().includes(normalizedSearch);

      return matchesRating && matchesSearch;
    });
  }, [ratingFilter, reviews, search]);

  return (
    <div className="max-w-[900px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <MessageSquare className="h-5 w-5 text-red-600" />
          후기 전체 관리
        </h1>
        <div className="flex gap-2 text-xs text-gray-500">
          <span className="rounded bg-gray-100 px-2 py-1">전체 {reviews.length}개</span>
          <span className="rounded bg-red-50 px-2 py-1 text-red-600">검색 {filteredReviews.length}개</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded border border-gray-200 bg-white p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="업소명, 작성자, 지역, 내용 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded border border-gray-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-red-500"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(event) => setRatingFilter(event.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-500"
        >
          {RATING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        리뷰는 현재 삭제만 가능합니다. 기존 관리자 삭제 API 동작은 그대로 유지됩니다.
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

      <div className="divide-y divide-gray-100 overflow-hidden rounded border border-gray-200 bg-white">
        {loading ? <div className="py-10 text-center text-sm text-gray-400">리뷰 목록을 불러오는 중입니다.</div> : null}

        {!loading && filteredReviews.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            {reviews.length === 0 ? '등록된 리뷰가 없습니다.' : '검색 조건에 맞는 리뷰가 없습니다.'}
          </div>
        ) : null}

        {!loading &&
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="flex items-start gap-3 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">{review.authorName}</span>
                  <span className="text-xs font-medium text-red-500">{review.shopName}</span>
                  {review.shopRegionLabel ? (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
                      {review.shopRegionLabel}
                    </span>
                  ) : null}
                  <StarRow rating={review.rating} />
                  <span className="ml-auto text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">{review.content}</p>
              </div>

              <div className="shrink-0">
                <button
                  onClick={() => void removeReview(review.id)}
                  disabled={deletingId === review.id}
                  title="삭제"
                  className="rounded border border-red-200 p-1.5 text-red-400 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
