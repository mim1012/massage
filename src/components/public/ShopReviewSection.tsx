'use client';

import { useEffect, useMemo, useState } from 'react';
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

type ShopDetailResponse = {
  reviews?: Review[];
};

const PLACEHOLDER_LINE_WIDTHS = ['w-full', 'w-11/12', 'w-4/5'] as const;

export default function ShopReviewSection({ slug, shopId, shopName, initialReviewCount }: ShopReviewSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, authChecked } = useAuthSession();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

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

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    if (!user) {
      setReviews(null);
      setIsLoadingReviews(false);
      return;
    }

    let cancelled = false;
    setIsLoadingReviews(true);

    void (async () => {
      try {
        const response = await fetch(`/api/shops/${encodeURIComponent(slug)}`, {
          cache: 'no-store',
          credentials: 'include',
        });

        if (!response.ok) {
          if (!cancelled) {
            setReviews([]);
          }
          return;
        }

        const result = (await response.json()) as ShopDetailResponse;
        if (!cancelled) {
          setReviews(result.reviews ?? []);
        }
      } catch {
        if (!cancelled) {
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
    };
  }, [authChecked, slug, user]);

  const visibleReviewCount = user ? (reviews?.length ?? initialReviewCount) : initialReviewCount;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-sm font-black text-gray-800">⭐ 방문 후기 ({visibleReviewCount})</h2>
        <Link href={`/board/review?shopId=${shopId}`} className="text-xs text-[var(--portal-brand)] hover:underline">
          전체보기 &raquo;
        </Link>
      </div>

      <ShopReviewForm shopId={shopId} shopName={shopName} />

      {!authChecked ? (
        <p className="py-6 text-center text-sm text-gray-400">후기 목록을 준비하는 중입니다.</p>
      ) : !user ? (
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
                  onClick={() => router.push(loginHref)}
                  className="mt-4 inline-flex min-w-28 items-center justify-center rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  로그인
                </button>
              </div>
            </div>
          </div>
        )
      ) : isLoadingReviews ? (
        <p className="py-6 text-center text-sm text-gray-400">후기를 불러오는 중입니다.</p>
      ) : !reviews || reviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">아직 후기가 없습니다.</p>
      ) : (
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
      )}
    </div>
  );
}
