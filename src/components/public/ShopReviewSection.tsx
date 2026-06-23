'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Star } from 'lucide-react';
import ShopReviewForm from '@/components/public/ShopReviewForm';
import { useAuthSession } from '@/lib/use-auth-session';
import type { Review } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type ShopReviewSectionProps = {
  slug: string;
  shopId: string;
  shopName: string;
  initialReviewCount: number;
};

type ShopReviewsResponse = {
  reviews?: Review[];
};

type ReviewGateIntent = 'view' | 'write';

const PLACEHOLDER_LINE_WIDTHS = ['w-full', 'w-11/12', 'w-4/5'] as const;
const MEMBER_LOADING_PLACEHOLDER_COUNT = 2;

export default function ShopReviewSection({ slug, shopId, shopName, initialReviewCount }: ShopReviewSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, authChecked } = useAuthSession();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [gateIntent, setGateIntent] = useState<ReviewGateIntent | null>(null);

  const loginHref = useMemo(() => {
    const query = searchParams.toString();
    const redirectPath = pathname ? `${pathname}${query ? `?${query}` : ''}` : '/';
    return `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;
  }, [pathname, searchParams]);

  const lockedPreviewCount = useMemo(() => {
    if (initialReviewCount <= 0) {
      return 0;
    }

    return Math.min(Math.max(initialReviewCount, 1), 3);
  }, [initialReviewCount]);

  const gateCopy = useMemo(() => {
    if (gateIntent === 'write') {
      return {
        title: '후기 작성은 회원만 가능합니다.',
        description: '로그인하면 현재 업소 상세페이지로 다시 돌아와 바로 후기를 남길 수 있습니다.',
        actionLabel: '로그인 후 후기 쓰기',
      };
    }

    return {
      title: '후기는 회원만 확인 가능합니다.',
      description: '로그인하면 전체 후기 목록과 상세 내용을 같은 화면에서 바로 이어서 볼 수 있습니다.',
      actionLabel: '로그인 후 후기 보기',
    };
  }, [gateIntent]);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    if (!user) {
      setReviews(null);
      setIsLoadingReviews(false);
      return;
    }

    if (initialReviewCount === 0) {
      setReviews((prev) => prev ?? []);
      setIsLoadingReviews(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setIsLoadingReviews(true);

    void (async () => {
      try {
        const response = await fetch(`/api/shops/${encodeURIComponent(slug)}/reviews`, {
          cache: 'no-store',
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          if (!cancelled) {
            setReviews([]);
          }
          return;
        }

        const result = (await response.json()) as ShopReviewsResponse;
        if (!cancelled) {
          setReviews(result.reviews ?? []);
        }
      } catch (error) {
        if (!cancelled && (!(error instanceof DOMException) || error.name !== 'AbortError')) {
          setReviews([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingReviews(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [authChecked, initialReviewCount, slug, user]);

const visibleReviewCount = user ? (reviews?.length ?? initialReviewCount) : initialReviewCount;

let reviewBody: React.ReactNode;

if (!authChecked) {
  reviewBody = <p className="py-6 text-center text-sm text-gray-400">후기 목록을 준비하는 중입니다.</p>;
} else if (!user) {
  reviewBody =
    initialReviewCount === 0 ? (
      <p className="py-6 text-center text-sm text-gray-400">아직 후기가 없습니다.</p>
    ) : (
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/70">
        <div className="pointer-events-none select-none divide-y divide-gray-100 blur-sm">
          {Array.from({ length: lockedPreviewCount }, (_, index) => (
            <div key={`locked-review-${index}`} className="space-y-3 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-16 rounded bg-gray-200" />
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star key={value} className="h-3 w-3 fill-amber-300 text-amber-300" />
                    ))}
                  </div>
                </div>
                <span className="h-3 w-14 rounded bg-gray-200" />
              </div>
              <div className="space-y-2">
                <div className={`h-3 rounded bg-gray-200 ${PLACEHOLDER_LINE_WIDTHS[index % PLACEHOLDER_LINE_WIDTHS.length]}`} />
                <div className={`h-3 rounded bg-gray-200 ${PLACEHOLDER_LINE_WIDTHS[(index + 1) % PLACEHOLDER_LINE_WIDTHS.length]}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-white/65 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[280px] rounded-2xl bg-white px-5 py-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            <p className="text-lg font-black text-gray-900">후기는 회원만 확인 가능합니다.</p>
            <button
              type="button"
              onClick={() => setGateIntent('view')}
              className="mt-4 inline-flex min-w-28 items-center justify-center rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    );
} else if (isLoadingReviews) {
  reviewBody = (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: MEMBER_LOADING_PLACEHOLDER_COUNT }, (_, index) => (
        <div key={`member-review-loading-${index}`} className="animate-pulse space-y-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-20 rounded bg-gray-200" />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star key={value} className="h-3 w-3 text-gray-200" />
                ))}
              </div>
            </div>
            <span className="h-3 w-16 rounded bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className={`h-3 rounded bg-gray-200 ${PLACEHOLDER_LINE_WIDTHS[index % PLACEHOLDER_LINE_WIDTHS.length]}`} />
            <div className={`h-3 rounded bg-gray-200 ${PLACEHOLDER_LINE_WIDTHS[(index + 1) % PLACEHOLDER_LINE_WIDTHS.length]}`} />
          </div>
        </div>
      ))}
    </div>
  );
} else if (!reviews || reviews.length === 0) {
  reviewBody = <p className="py-6 text-center text-sm text-gray-400">아직 후기가 없습니다.</p>;
} else {
  reviewBody = (
    <div className="divide-y divide-gray-100">
      {reviews.map((review) => (
        <div key={review.id} className="py-3">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">{review.authorName}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`h-3 w-3 ${
                      value <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">{review.content}</p>
        </div>
      ))}
    </div>
  );
}

const handleCreated = useCallback((created: Review) => {
  setReviews((prev) => {
    const base = prev ?? [];
    if (base.some((review) => review.id === created.id)) {
      return base;
    }
    return [created, ...base];
  });
}, []);

return (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
      <h2 className="text-sm font-black text-gray-800">⭐ 방문 후기 ({visibleReviewCount})</h2>
      {user ? (
        <Link href={`/board/review?shopId=${shopId}`} className="text-xs text-[var(--portal-brand)] hover:underline">
          전체보기 &raquo;
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setGateIntent('view')}
          className="text-xs font-bold text-[var(--portal-brand)] hover:underline"
        >
          전체보기 &raquo;
        </button>
      )}
    </div>

    <ShopReviewForm shopId={shopId} shopName={shopName} onRequireLogin={() => setGateIntent('write')} onCreated={handleCreated} />

    {reviewBody}

    {!user && gateIntent ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-black text-gray-900">{gateCopy.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-500">{gateCopy.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setGateIntent(null)}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            >
              닫기
            </button>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push(loginHref)}
              className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[var(--portal-brand)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--portal-brand-hover)]"
            >
              {gateCopy.actionLabel}
            </button>
            <button
              type="button"
              onClick={() => setGateIntent(null)}
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
            >
              나중에 보기
            </button>
          </div>
        </div>
      </div>
    ) : null}
  </div>
);
}
