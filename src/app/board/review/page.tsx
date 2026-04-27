import ReviewPageClient from '@/components/public/ReviewPageClient';
import { mapReviewsWithRegion } from '@/lib/public-page-data';
import { listReviews } from '@/lib/server/communityStore';
import { listShops } from '@/lib/server/shop-store';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<{
    shopId?: string | string[] | undefined;
    q?: string | string[] | undefined;
  }>;
};

export default async function ReviewPage({ searchParams }: PageProps) {
  await searchParams;

  const [reviews, shopResponse] = await Promise.all([
    listReviews(),
    listShops(),
  ]);

  return <ReviewPageClient initialReviews={mapReviewsWithRegion(reviews, shopResponse.allShops)} initialShops={shopResponse.allShops} />;
}
