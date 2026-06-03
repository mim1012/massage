import { Suspense } from 'react';
import ReviewPageClient from '@/components/public/ReviewPageClient';
import { listPublicReviewPage } from '@/lib/server/communityStore';
import { listShops } from '@/lib/server/shop-store';
import { mapReviewsWithRegion } from '@/lib/public-page-data';
import { normalizePageParam } from '@/lib/pagination';

export const dynamic = 'force-dynamic';

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<{
    page?: SearchParamValue;
    shopId?: SearchParamValue;
    q?: SearchParamValue;
  }>;
};

function pickFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReviewPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = normalizePageParam(pickFirst(resolvedSearchParams?.page));
  const shopId = pickFirst(resolvedSearchParams?.shopId);
  const search = pickFirst(resolvedSearchParams?.q);

  const [reviewPage, shopsData] = await Promise.all([
    listPublicReviewPage({ page, shopId, search }),
    listShops({}),
  ]);

  const allShops = shopsData.allShops;
  const initialReviews = mapReviewsWithRegion(reviewPage.items, allShops);

  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ReviewPageClient
        initialReviews={initialReviews}
        initialShops={allShops}
        initialPage={reviewPage.page}
        initialTotalPages={reviewPage.totalPages}
      />
    </Suspense>
  );
}
