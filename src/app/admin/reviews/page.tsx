'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, MessageSquare, Star, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { Review } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type ManagedReview = Review & { shopRegionLabel?: string };

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ManagedReview[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/admin/reviews', { cache: 'no-store' });
        const result = (await response.json()) as { reviews?: ManagedReview[]; error?: string };
        if (!response.ok || !result.reviews) {
          throw new Error(result.error ?? '리뷰 목록을 불러오지 못했습니다.');
        }

        setReviews(result.reviews);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '리뷰 목록을 불러오지 못했습니다.');
      }
    };

    void load();
  }, []);

  async function toggleHidden(id: string, isHidden: boolean) {
    const response = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHidden }),
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? '리뷰 상태를 변경하지 못했습니다.');
      return;
    }

    setReviews((current) =>
      current.map((review) => (review.id === id ? { ...review, isHidden } : review)),
    );
  }

  async function removeReview(id: string) {
    const response = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? '리뷰를 삭제하지 못했습니다.');
      return;
    }

    setReviews((current) => current.filter((review) => review.id !== id));
  }

  return (
    <div className="max-w-[900px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <MessageSquare className="h-5 w-5 text-red-600" />
          리뷰 관리
        </h1>
        <div className="rounded bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
          총 {reviews.length}건
        </div>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      ) : null}

      <div className="divide-y divide-gray-100 overflow-hidden rounded border border-gray-200 bg-white">
        {reviews.map((review) => (
          <div
            key={review.id}
            className={clsx('flex items-start gap-3 p-4', review.isHidden && 'bg-gray-50 opacity-70')}
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-800">{review.authorName}</span>
                <span className="text-xs text-red-500">{review.shopName}</span>
                {review.shopRegionLabel ? (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
                    {review.shopRegionLabel}
                  </span>
                ) : null}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <Star
                      key={score}
                      className={`h-3 w-3 ${score <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="ml-auto text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">{review.content}</p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => void toggleHidden(review.id, !review.isHidden)}
                className="rounded border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50"
                title={review.isHidden ? '노출' : '숨김'}
              >
                {review.isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => void removeReview(review.id)}
                className="rounded border border-red-200 p-1.5 text-red-500 hover:bg-red-50"
                title="삭제"
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
