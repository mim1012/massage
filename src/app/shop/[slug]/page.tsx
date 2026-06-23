import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Clock, Crown, MapPin, MessageCircle, Phone, Star } from 'lucide-react';
import { formatRating } from '@/lib/utils';
import { sanitizeShopDescriptionHtml, stripShopDescriptionToText } from '@/lib/shop-description';
import { getShopBySlug, getShopMetadataBySlug, listVisibleShopSlugs } from '@/lib/server/shop-store';
import ScrollToTopOnMount from '@/components/public/ScrollToTopOnMount';
import ShopBrowseBreadcrumbs from '@/components/public/ShopBrowseBreadcrumbs';
import ShopMediaSection from '@/components/public/ShopMediaSection';
import ShopReviewSection from '@/components/public/ShopReviewSection';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 120;

export async function generateStaticParams() {
  try {
    const slugs = await listVisibleShopSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getShopMetadataBySlug(slug);

  if (!data) {
    return { title: '업소를 찾을 수 없습니다' };
  }

  return {
    title: `${data.name} - ${data.regionLabel} ${data.themeLabel}`,
    description: stripShopDescriptionToText(data.description).slice(0, 155),
  };
}

export const preferredRegion = 'sin1';

const themeEmoji: Record<string, string> = {
  swedish: '',
  aroma: '🌸',
  thai: '🙏',
  sport: '💪',
  deep: '',
  hot_stone: '💎',
  foot: '🦶',
  couple: '👫',
};

const bgColors = [
  'from-orange-200 to-amber-100',
  'from-rose-200 to-pink-100',
  'from-[var(--portal-brand-soft)] to-[var(--portal-bg)]',
  'from-amber-200 to-orange-100',
  'from-yellow-200 to-amber-100',
];

export default async function ShopDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getShopBySlug(slug);

  if (!data) {
    notFound();
  }

  const { shop } = data;
  const shopDescriptionHtml = sanitizeShopDescriptionHtml(shop.description);
  const previewImage = (shop.thumbnailUrl || shop.bannerUrl).trim();
  const primaryImage = (shop.detailImageUrl || shop.bannerUrl || shop.thumbnailUrl).trim();
  const bgColor = bgColors[Math.abs(parseInt(shop.id.replace(/\D/g, ''), 10) || 0) % bgColors.length];

  return (
    <>
      <ScrollToTopOnMount />
      <div className="mx-auto max-w-[1400px] px-3 py-3">
        <ShopBrowseBreadcrumbs
          shopName={shop.name}
          shopRegion={shop.region}
          shopRegionLabel={shop.regionLabel}
          shopSubRegion={shop.subRegion}
          shopTheme={shop.theme}
          shopThemeLabel={shop.themeLabel}
        />
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

            {primaryImage ? <ShopMediaSection key={primaryImage} shopName={shop.name} previewImage={previewImage} primaryImage={primaryImage} galleryImages={shop.images} /> : null}

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-2 border-b border-gray-200 pb-2 text-sm font-black text-gray-800">📝 업소 소개</h2>
              <div
                className="prose prose-sm max-w-none overflow-hidden break-words text-gray-600 [overflow-wrap:anywhere] prose-img:h-auto prose-img:max-w-full prose-img:rounded-2xl prose-img:shadow-sm prose-p:leading-relaxed [&_*]:max-w-full [&_a]:break-all"
                dangerouslySetInnerHTML={{ __html: shopDescriptionHtml }}
              />
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
                      <td className="text-right font-bold text-[var(--portal-brand)]">{course.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ShopReviewSection
              slug={shop.slug}
              shopId={shop.id}
              shopName={shop.name}
              initialReviewCount={shop.reviewCount}
            />
          </div>

          <div className="space-y-3">
            <a
              href={`tel:${shop.phone}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--portal-brand)] py-3 text-sm font-bold text-white transition-colors active:scale-95 hover:bg-[var(--portal-brand-hover)]"
            >
              <Phone className="h-4 w-4" />
              지금 전화하기
            </a>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-3 border-b border-gray-200 pb-2 text-sm font-black text-gray-800">📌 영업 정보</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-brand)]" />
                  <div>
                    <p className="mb-0.5 text-[11px] text-gray-400">전화번호</p>
                    <a href={`tel:${shop.phone}`} className="font-semibold text-gray-800 hover:text-[var(--portal-brand)]">
                      {shop.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-brand)]" />
                  <div>
                    <p className="mb-0.5 text-[11px] text-gray-400">영업시간</p>
                    <p className="text-gray-800">{shop.hours}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--portal-brand)]" />
                  <div>
                    <p className="mb-0.5 text-[11px] text-gray-400">주소</p>
                    <p className="text-gray-800">{shop.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href={`/board/qna?shopId=${shop.id}`}
              className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-[var(--portal-brand)]"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[var(--portal-brand)]" />
                <span className="text-sm font-semibold text-gray-800 group-hover:text-[var(--portal-brand)]">Q&A 문의</span>
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
    </>
  );
}
