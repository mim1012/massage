import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Clock, Crown, MapPin, MessageCircle, Phone, Star } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/guards';
import type { Review } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { getShopBySlug } from '@/lib/server/shop-store';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getShopBySlug(slug);

  if (!data) {
    return { title: '업소를 찾을 수 없습니다' };
  }

  return {
    title: `${data.shop.name} - ${data.shop.regionLabel} ${data.shop.themeLabel}`,
    description: data.shop.description.slice(0, 155),
  };
}

export const dynamic = 'force-dynamic';

const bgColors = [
  'from-rose-200 to-pink-100',
  'from-purple-200 to-violet-100',
  'from-blue-200 to-sky-100',
  'from-emerald-200 to-teal-100',
  'from-amber-200 to-orange-100',
];

export default async function ShopDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getShopBySlug(slug);

  if (!data) {
    notFound();
  }

  const currentUser = await getSessionUser();
  const { shop, reviews } = data;
  const bgColor = bgColors[Math.abs(parseInt(shop.id.replace(/\D/g, ''), 10) || 0) % bgColors.length];

  return (
    <div className="max-w-[1400px] mx-auto px-3 py-3">
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link href="/" className="hover:text-red-600">
          홈
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/?region=${shop.region}`} className="hover:text-red-600">
          {shop.regionLabel}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800 font-medium">{shop.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
        <div className="space-y-3">
          <div className={`relative bg-gradient-to-br ${bgColor} rounded-lg overflow-hidden p-6 sm:p-8`}>
            <div className="relative">
              {shop.isPremium && (
                <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded mb-2">
                  <Crown className="w-3 h-3" />
                  프리미엄
                </span>
              )}
              <h1 className="text-2xl font-black text-gray-900 mb-1">{shop.name}</h1>
              <p className="text-sm text-gray-600 mb-3">{shop.tagline}</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`w-4 h-4 ${
                      value <= Math.round(shop.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-sm font-bold text-gray-700 ml-1">{shop.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({reviews.length}개 리뷰)</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-black text-gray-800 mb-2 pb-2 border-b border-gray-200">업소 소개</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{shop.description}</p>
            {shop.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {shop.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-black text-gray-800 mb-2 pb-2 border-b border-gray-200">코스 안내</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 font-medium">코스</th>
                  <th className="text-center py-2 font-medium">Time</th>
                  <th className="text-right py-2 font-medium">가격</th>
                </tr>
              </thead>
              <tbody>
                {shop.courses.map((course, index) => (
                  <tr key={`${course.name}-${index}`} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5">
                      <p className="font-semibold text-gray-800">{course.name}</p>
                      {course.description && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{course.description}</p>
                      )}
                    </td>
                    <td className="text-center text-gray-500">{course.duration}</td>
                    <td className="text-right font-bold text-red-600">{course.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
              <h2 className="text-sm font-black text-gray-800">Recent reviews ({reviews.length})</h2>
              <Link href={`/board/review?shopId=${shop.id}`} className="text-xs text-red-600 hover:underline">
                View all »
              </Link>
            </div>
            {!currentUser ? (
              <div className="rounded border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-500">
                리뷰는 로그인한 회원만 확인할 수 있습니다.
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">등록된 리뷰가 아직 없습니다.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {reviews.map((review: Review) => (
                  <div key={review.id} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800">{review.authorName}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                              key={value}
                              className={`w-3 h-3 ${
                                value <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <a
            href={`tel:${shop.phone}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors active:scale-95"
          >
            <Phone className="w-4 h-4" />
            전화 문의
          </a>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-black text-gray-800 mb-3 pb-2 border-b border-gray-200">업소 정보</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">연락처</p>
                  <a href={`tel:${shop.phone}`} className="font-semibold text-gray-800 hover:text-red-600">
                    {shop.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">운영 시간</p>
                  <p className="text-gray-800">{shop.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Address</p>
                  <p className="text-gray-800">{shop.address}</p>
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/board/qna?shopId=${shop.id}`}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-red-300 transition-all group"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-gray-800 group-hover:text-red-600">Q&amp;A</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
