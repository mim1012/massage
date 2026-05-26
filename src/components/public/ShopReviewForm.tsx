'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, PenLine, Star } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@/lib/types';

type SessionResponse = {
  user?: User | null;
};

interface ShopReviewFormProps {
  shopId: string;
  shopName: string;
}

export default function ShopReviewForm({ shopId, shopName }: ShopReviewFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
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

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!cancelled) {
          if (response.ok) {
            const result = (await response.json()) as SessionResponse;
            setUser(result.user ?? null);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsAuthResolved(true);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      router.push(loginHref);
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

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? '후기를 등록하지 못했습니다.');
      }

      setContent('');
      setRating(5);
      setIsExpanded(false);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '후기를 등록하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAuthResolved) {
    return (
      <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-400">
        로그인 상태를 확인하는 중입니다.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">후기를 작성하려면 로그인이 필요합니다.</p>
        <button
          type="button"
          onClick={() => router.push(loginHref)}
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

          <div className="flex justify-end">
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
