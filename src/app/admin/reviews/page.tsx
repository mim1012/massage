'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Star, Trash2 } from 'lucide-react';
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
        <div className="rounded bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">총 {reviews.length}건</div>
      </div>

      <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        리뷰는 삭제만 가능합니다. 오너와 관리자는 본인 권한 범위의 리뷰를 삭제할 수 있습니다.
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

      <div className="divide-y divide-gray-100 overflow-hidden rounded border border-gray-200 bg-white">
        {reviews.map((review) => (
          <div key={review.id} className="flex items-start gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-gray-800">{review.authorName}</span>
                <span className="text-xs text-red-500">{review.shopName}</span>
                {review.shopRegionLabel ? (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">{review.shopRegionLabel}</span>
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
                onClick={() => void removeReview(review.id)}
                className="rounded border border-red-200 p-1.5 text-red-500 hover:bg-red-50"
                title="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 ? <div className="p-6 text-center text-sm text-gray-400">등록된 리뷰가 없습니다.</div> : null}
      </div>
    </div>
  );
}
