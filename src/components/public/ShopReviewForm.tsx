'use client';

import { useMemo, useState } from 'react';
import { Loader2, PenLine, Star } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthSession } from '@/lib/use-auth-session';
import type { Review } from '@/lib/types';

interface ShopReviewFormProps {
  shopId: string;
  shopName: string;
  onRequireLogin?: () => void;
  onCreated?: (review: Review) => void;
}

export default function ShopReviewForm({ shopId, shopName, onRequireLogin, onCreated }: ShopReviewFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, authChecked } = useAuthSession();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const loginHref = useMemo(() => {
    const query = searchParams.toString();
    const redirectPath = pathname ? `${pathname}${query ? `?${query}` : ''}` : '/';
    return `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;
  }, [pathname, searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      if (onRequireLogin) {
        onRequireLogin();
      } else {
        router.push(loginHref);
      }
      return;
    }

    if (!content.trim()) {
      setError('후기 내용을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/board/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, rating, content }),
      });

      const result = (await response.json()) as { error?: string; review?: Review };
      if (!response.ok) {
        throw new Error(result.error ?? '후기를 등록하지 못했습니다.');
      }

      setContent('');
      setRating(5);
      setIsExpanded(false);
      if (result.review) {
        onCreated?.(result.review);
      }
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '후기를 등록하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const showGuestPrompt = authChecked ? !user : true;

  if (showGuestPrompt) {
    return (
      <button
        type="button"
        onClick={() => {
          if (!authChecked) {
            return;
          }

          if (onRequireLogin) {
            onRequireLogin();
            return;
          }

          router.push(loginHref);
        }}
        disabled={!authChecked}
        className="mb-6 block w-full overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--portal-brand)_14%,white)] bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(255,247,245,0.98))] p-4 text-left shadow-sm transition hover:border-[color-mix(in_srgb,var(--portal-brand)_26%,white)] hover:shadow-md disabled:cursor-default disabled:opacity-80"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--portal-brand-soft)] text-[var(--portal-brand)]">
              {authChecked ? <PenLine className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">
                {authChecked ? '로그인 후 후기를 남길 수 있습니다.' : '후기 작성 영역을 준비하고 있습니다.'}
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                {authChecked
                  ? '작성 시도 시 현재 상세페이지로 다시 돌아오도록 이어집니다.'
                  : '로그인 상태를 조용히 확인한 뒤 바로 작성 화면 또는 로그인 안내로 이어집니다.'}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[var(--portal-brand)] shadow-sm">
            {authChecked ? '회원 전용' : '준비 중'}
          </span>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white/85 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((score) => (
                <Star key={score} className="h-4 w-4 fill-gray-200 text-gray-200" />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-gray-400">{authChecked ? '로그인 필요' : '상태 확인 중'}</span>
          </div>
          <div className="mt-3 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-400">
            {shopName} 방문 후기를 작성해 보세요.
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--portal-brand)_15%,white)] bg-white shadow-sm">
      {!isExpanded ? (
        <button
          type="button"
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
            {[1, 2, 3, 4, 5].map((score) => (
              <Star key={score} className="h-3.5 w-3.5 fill-gray-200 text-gray-200" />
            ))}
          </div>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setRating(score)}
                  className="transition-transform active:scale-125"
                  aria-label={`${score}점 선택`}
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      score <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
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
            onChange={(event) => setContent(event.target.value)}
            placeholder={`${shopName}에서의 경험을 공유해주세요.`}
            className="mb-3 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:border-[var(--portal-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-brand)]"
            rows={3}
            required
          />

          {error ? <p className="mb-3 text-xs text-red-500">{error}</p> : null}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-2 rounded-lg bg-[var(--portal-brand)] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-[var(--portal-brand-hover)] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '후기 등록'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}