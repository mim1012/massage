import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Clock, Crown, MapPin, MessageCircle, Phone, Star } from 'lucide-react';
import { DISTRICTS } from '@/lib/catalog';
import { buildShopBrowseHref, getShopBrowseLabel } from '@/lib/browse-context';
import type { Review } from '@/lib/types';
import { formatDate, formatRating } from '@/lib/utils';
import { getShopBySlug } from '@/lib/server/shop-store';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    source?: string;
    view?: string;
    region?: string;
    subRegion?: string;
    theme?: string;
  }>;
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

const themeEmoji: Record<string, string> = {
  swedish: '🌿',
  aroma: '🌸',
  thai: '🙏',
  sport: '💪',
  deep: '🔥',
  hot_stone: '💎',
  foot: '🦶',
  couple: '👫',
};

const bgColors = [
  'from-orange-200 to-amber-100',
  'from-rose-200 to-pink-100',
  'from-[#FEFAE0] to-[#FCF9F5]',
  'from-amber-200 to-orange-100',
  'from-yellow-200 to-amber-100',
];

export default async function ShopDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const currentSearchParams = searchParams ? await searchParams : undefined;
  const data = await getShopBySlug(slug);

  if (!data) {
    notFound();
  }

  const { shop, reviews } = data;
  const bgColor = bgColors[Math.abs(parseInt(shop.id.replace(/\D/g, ''), 10) || 0) % bgColors.length];
  const source = currentSearchParams?.source === 'top100' ? 'top100' : 'home';
  const preservedMode = currentSearchParams?.view === 'theme' && currentSearchParams?.theme === shop.theme ? 'theme' : 'region';
  const preservedRegion =
    source === 'top100'
      ? currentSearchParams?.region === shop.region
        ? currentSearchParams.region
        : undefined
      : currentSearchParams?.region === shop.region
        ? currentSearchParams.region
        : shop.region;
  const preservedSubRegion =
    currentSearchParams?.subRegion && currentSearchParams.subRegion === shop.subRegion ? currentSearchParams.subRegion : undefined;
  const preservedTheme =
    currentSearchParams?.theme && currentSearchParams.theme === shop.theme ? currentSearchParams.theme : undefined;
  const browseHref = buildShopBrowseHref({
    mode: preservedMode,
    source,
    region: preservedRegion,
    subRegion: preservedSubRegion,
    theme: preservedTheme,
  });
  const browseLabel = getShopBrowseLabel({
    mode: preservedMode,
    source,
    region: preservedRegion,
    subRegion: preservedSubRegion,
    theme: preservedTheme,
    fallbackRegionLabel: shop.regionLabel,
    fallbackThemeLabel: shop.themeLabel,
    subRegionLabel:
      currentSearchParams?.region && currentSearchParams?.subRegion
        ? DISTRICTS[currentSearchParams.region]?.find((district) => district.code === currentSearchParams.subRegion)?.label
        : undefined,
  });

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-3">
      <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#D4A373]">
          홈
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={browseHref} className="hover:text-[#D4A373]">
          {browseLabel}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-gray-800">{shop.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${bgColor} p-6 sm:p-8`}>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 select-none text-[120px] opacity-10">
              {themeEmoji[shop.theme] ?? '✨'}
            </div>
            <div className="relative">
              {shop.isPremium ? (
                <span className="mb-2 inline-flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                  <Crown className="h-3 w-3" /> PREMIUM
                </span>
              ) : null}
              <h1 className="mb-1 text-2xl font-black text-gray-900">{shop.name}</h1>
              <p className="mb-3 text-sm text-gray-600">{shop.tagline}</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`h-4 w-4 ${
                      value <= Math.round(shop.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm font-bold text-gray-700">{formatRating(shop.rating)}</span>
                <span className="text-xs text-gray-500">({shop.reviewCount}개 후기)</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-2 border-b border-gray-200 pb-2 text-sm font-black text-gray-800">📝 업소 소개</h2>
            <p className="text-sm leading-relaxed text-gray-600">{shop.description}</p>
            {shop.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1">
                {shop.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-2 border-b border-gray-200 pb-2 text-sm font-black text-gray-800">💰 코스 & 요금표</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="py-2 text-left font-medium">코스명</th>
                  <th className="py-2 text-center font-medium">시간</th>
                  <th className="py-2 text-right font-medium">가격</th>
                </tr>
              </thead>
              <tbody>
                {shop.courses.map((course, index) => (
                  <tr key={`${course.name}-${index}`} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5">
                      <p className="font-semibold text-gray-800">{course.name}</p>
                      {course.description ? <p className="mt-0.5 text-[11px] text-gray-400">{course.description}</p> : null}
                    </td>
                    <td className="text-center text-gray-500">{course.duration}</td>
                    <td className="text-right font-bold text-[#D4A373]">{course.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2">
              <h2 className="text-sm font-black text-gray-800">⭐ 방문 후기 ({reviews.length})</h2>
              <Link href={`/board/review?shopId=${shop.id}`} className="text-xs text-[#D4A373] hover:underline">
                전체보기 &raquo;
              </Link>
            </div>
            {reviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">아직 후기가 없습니다.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {reviews.map((review: Review) => (
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
        </div>

        <div className="space-y-3">
          <a
            href={`tel:${shop.phone}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4A373] py-3 text-sm font-bold text-white transition-colors active:scale-95 hover:bg-[#C29262]"
          >
            <Phone className="h-4 w-4" />
            지금 전화하기
          </a>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 border-b border-gray-200 pb-2 text-sm font-black text-gray-800">📌 영업 정보</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A373]" />
                <div>
                  <p className="mb-0.5 text-[11px] text-gray-400">전화번호</p>
                  <a href={`tel:${shop.phone}`} className="font-semibold text-gray-800 hover:text-[#D4A373]">
                    {shop.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A373]" />
                <div>
                  <p className="mb-0.5 text-[11px] text-gray-400">영업시간</p>
                  <p className="text-gray-800">{shop.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A373]" />
                <div>
                  <p className="mb-0.5 text-[11px] text-gray-400">주소</p>
                  <p className="text-gray-800">{shop.address}</p>
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/board/qna?shopId=${shop.id}`}
            className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-[#D4A373]"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#D4A373]" />
              <span className="text-sm font-semibold text-gray-800 group-hover:text-[#D4A373]">Q&A 문의</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>

          <div className="ad-slot h-[200px] rounded">
            <div className="text-center">
              <span>광고 배너 영역</span>
              <br />
              <span className="text-[10px]">280×200</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
