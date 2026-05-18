'use client';

import { useState, useEffect } from 'react';
import { Star, PenLine, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';

interface ShopReviewFormProps {
  shopId: string;
  shopName: string;
}

export default function ShopReviewForm({ shopId, shopName }: ShopReviewFormProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('로그인 후 이용 가능합니다.');
      return;
    }
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/board/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, rating, content }),
      });

      if (!res.ok) throw new Error('등록 실패');

      setContent('');
      setRating(5);
      setIsExpanded(false);
      router.refresh(); // 데이터 갱신
    } catch (err) {
      setError('후기를 등록하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">후기를 작성하려면 로그인이 필요합니다.</p>
        <button
          onClick={() => router.push(`/auth/login?redirect=${window.location.pathname}`)}
          className="mt-2 text-xs font-bold text-[var(--portal-brand)] hover:underline"
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--portal-brand)_15%,white)] bg-white shadow-sm">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]">
              <PenLine className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-gray-600">방문 후기를 남겨주세요...</span>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-3.5 w-3.5 fill-gray-200 text-gray-200" />
            ))}
          </div>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="transition-transform active:scale-125"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-1 text-sm font-bold text-gray-700">{rating}점</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              닫기
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`${shopName}에서의 경험을 공유해주세요.`}
            className="mb-3 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:border-[var(--portal-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-brand)]"
            rows={3}
            required
          />

          {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-2 rounded-lg bg-[var(--portal-brand)] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-[var(--portal-brand-hover)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '후기 등록'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
