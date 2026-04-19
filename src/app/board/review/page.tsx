import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { listReviews } from '@/lib/server/communityStore';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Reviews',
};

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const reviews = await listReviews();

  return (
    <div className="mx-auto max-w-[800px] px-3 py-4">
      <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
        <Link href="/" className="hover:text-red-600">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/board" className="hover:text-red-600">
          Board
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800">Reviews</span>
      </div>
      <h1 className="mb-3 text-lg font-black text-gray-800">업소 후기</h1>
      <div className="divide-y divide-gray-100 overflow-hidden rounded border border-gray-200 bg-white">
        {reviews.map((review) => (
          <div key={review.id} className="p-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">{review.authorName}</span>
                <span className="text-xs text-red-500">{review.shopName}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <Star
                      key={score}
                      className={`h-3 w-3 ${score <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
            </div>
            <p className="leading-relaxed text-sm text-gray-600">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
