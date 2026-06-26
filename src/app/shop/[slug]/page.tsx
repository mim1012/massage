import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Clock, Crown, MapPin, MessageCircle, Phone } from 'lucide-react';
import ShopRatingBadge from '@/components/public/ShopRatingBadge';
import { sanitizeShopDescriptionHtml, stripShopDescriptionToText } from '@/lib/shop-description';
import { getShopBySlug, getShopMetadataBySlug } from '@/lib/server/shop-store';
import ScrollToTopOnMount from '@/components/public/ScrollToTopOnMount';
import ShopBrowseBreadcrumbs from '@/components/public/ShopBrowseBreadcrumbs';
import ShopMediaSection from '@/components/public/ShopMediaSection';
import ShopReviewSection from '@/components/public/ShopReviewSection';
import AdBannerSlot from '@/components/public/AdBannerSlot';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 120;

export function generateStaticParams() {
  return [];
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
      <main className="mx-auto max-w-[860px] px-4 py-4">
        <ShopBrowseBreadcrumbs
          shopName={shop.name}
          shopRegion={shop.region}
          shopRegionLabel={shop.regionLabel}
          shopSubRegion={shop.subRegion}
          shopTheme={shop.theme}
          shopThemeLabel={shop.themeLabel}
        />
        <div className="mt-2 space-y-2">
          {/* 1. 업소 요약 카드 */}
          <section className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${bgColor} p-3 sm:p-4`}>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 select-none text-[80px] opacity-10">
              {themeEmoji[shop.theme] ?? '✨'}
            </div>
            <div className="relative flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {shop.isPremium ? (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                    <Crown className="h-3 w-3" /> PREMIUM
                  </span>
                ) : null}
                <h1 className="text-lg font-black text-gray-900 leading-none">{shop.name}</h1>
                <ShopRatingBadge slug={shop.slug} rating={shop.rating} reviewCount={shop.reviewCount} />
              </div>
              <p className="text-xs text-gray-600 line-clamp-1">{shop.tagline}</p>
            </div>
          </section>

          {/* 2. 문의 / 영업 정보 카드 */}
          <section className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
            <div className="mb-3 flex gap-2">
              <a
                href={`tel:${shop.phone}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--portal-brand)] py-2 text-[13px] font-bold text-white transition-colors active:scale-95 hover:bg-[var(--portal-brand-hover)]"
              >
                <Phone className="h-3.5 w-3.5" />
                전화하기
              </a>
              <Link
                href={`/board/qna?shopId=${shop.id}`}
                className="group flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-[13px] font-bold text-gray-700 transition-colors active:scale-95 hover:border-[var(--portal-brand)] hover:text-[var(--portal-brand)]"
              >
                <MessageCircle className="h-3.5 w-3.5 text-gray-400 group-hover:text-[var(--portal-brand)]" />
                Q&A 문의
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <a href={`tel:${shop.phone}`} className="font-semibold text-gray-800 hover:text-[var(--portal-brand)]">
                  {shop.phone}
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-800">{shop.hours}</span>
              </div>
              <div className="flex w-full items-center gap-1.5 sm:w-auto">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="line-clamp-1 text-gray-800">{shop.address}</span>
              </div>
            </div>
          </section>

          {/* 3. 빠른 요약 카드 */}
          <section className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
            <h3 className="mb-2.5 flex items-center text-[13px] font-black text-gray-800">
              <span className="mr-1 text-[var(--portal-brand)]">⚡</span> 빠른 요약
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex gap-2">
                <span className="shrink-0 font-bold text-gray-400">소개</span>
                <span className="text-gray-700 line-clamp-1">{stripShopDescriptionToText(shop.description)}</span>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 font-bold text-gray-400">코스</span>
                <span className="text-gray-700 line-clamp-1">
                  {shop.courses.slice(0, 2).map(c => `${c.name} (${c.price})`).join(' / ')}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 font-bold text-gray-400">후기</span>
                <span className="text-gray-700">방문 후기 {shop.reviewCount}개</span>
              </div>
            </div>
          </section>

          {/* 4. 업소 사진 카드 */}
          {primaryImage ? (
            <section>
              <ShopMediaSection key={primaryImage} shopName={shop.name} previewImage={previewImage} primaryImage={primaryImage} galleryImages={shop.images} />
            </section>
          ) : null}

          {/* 5. 업소 소개 카드 */}
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 border-b border-gray-200 pb-2 text-sm font-black text-gray-800">📝 업소 소개</h2>
            <div
              className="prose prose-sm max-w-none break-words text-gray-600 [overflow-wrap:anywhere] prose-img:h-auto prose-img:max-w-full prose-img:rounded-2xl prose-img:shadow-sm prose-p:leading-relaxed [&_*]:max-w-full [&_a]:break-all"
              dangerouslySetInnerHTML={{ __html: shopDescriptionHtml }}
            />
            {shop.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {shop.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-gray-200 bg-gray-100 px-2 py-1 text-[11px] text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          {/* 6. 코스 & 요금표 카드 */}
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 border-b border-gray-200 pb-2 text-sm font-black text-gray-800">💰 코스 & 요금표</h2>
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
          </section>

          {/* 7. 방문 후기 카드 */}
          <section>
            <ShopReviewSection
              slug={shop.slug}
              shopId={shop.id}
              shopName={shop.name}
              initialReviewCount={shop.reviewCount}
            />
          </section>

          {/* 광고 배너 */}
          <section>
            <AdBannerSlot slot="detail" heightClass="h-[150px]">
              <div className="ad-slot h-[150px] rounded">
                <div className="text-center">
                  <span>광고 배너 영역</span>
                  <br />
                  <span className="text-[10px]">반응형 배너</span>
                </div>
              </div>
            </AdBannerSlot>
          </section>
        </div>
      </main>
    </>
  );
}