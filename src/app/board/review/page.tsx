import ReviewPageClient from '@/components/public/ReviewPageClient';
import { normalizePageParam } from '@/lib/pagination';
import { mapReviewsWithRegion } from '@/lib/public-page-data';
import { listPublicReviewPage } from '@/lib/server/communityStore';
import { listShops } from '@/lib/server/shop-store';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<{
    page?: string | string[] | undefined;
    shopId?: string | string[] | undefined;
    q?: string | string[] | undefined;
  }>;
};

function pickFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReviewPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = normalizePageParam(pickFirst(resolvedSearchParams?.page));
  const shopId = pickFirst(resolvedSearchParams?.shopId);
  const search = pickFirst(resolvedSearchParams?.q)?.trim();

  const [reviewPage, shopResponse] = await Promise.all([
    listPublicReviewPage({ page, shopId, search }),
    listShops(),
  ]);

  return (
    <ReviewPageClient
      initialReviews={mapReviewsWithRegion(reviewPage.items, shopResponse.allShops)}
      initialShops={shopResponse.allShops}
      initialPage={reviewPage.page}
      initialTotalPages={reviewPage.totalPages}
    />
  );
}
