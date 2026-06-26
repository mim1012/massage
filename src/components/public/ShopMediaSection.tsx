'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ShopMediaSectionProps = {
  shopName: string;
  previewImage?: string;
  primaryImage: string;
  galleryImages: string[];
};

const INITIAL_VISIBLE_GALLERY_IMAGES = 6;

function withShopMediaVariant(source: string, variant: 'hero' | 'gallery') {
  const normalizedSource = source.trim();
  if (!normalizedSource || normalizedSource.startsWith('data:')) {
    return normalizedSource;
  }

  if (/([?&])size=[^&]*/.test(normalizedSource)) {
    return normalizedSource.replace(/([?&])size=[^&]*/, `$1size=${variant}`);
  }

  return `${normalizedSource}${normalizedSource.includes('?') ? '&' : '?'}size=${variant}`;
}


export default function ShopMediaSection({ shopName, previewImage = '', primaryImage, galleryImages }: ShopMediaSectionProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_GALLERY_IMAGES);

  const dedupedGalleryImages = useMemo(
    () => Array.from(new Set(galleryImages.map((value) => withShopMediaVariant(value, 'gallery')).filter(Boolean))),
    [galleryImages],
  );
  const visibleGalleryImages = dedupedGalleryImages.slice(0, visibleCount);
  const remainingImageCount = Math.max(dedupedGalleryImages.length - visibleGalleryImages.length, 0);
  const hasGallery = dedupedGalleryImages.length > 0;
  const hasMoreGalleryImages = remainingImageCount > 0;
  const previewImageUrl = withShopMediaVariant(previewImage, 'hero');
  const primaryImageUrl = withShopMediaVariant(primaryImage, 'hero');
  const hasSeparatePreviewImage = Boolean(previewImageUrl) && previewImageUrl !== primaryImageUrl;
  const [primaryImageLoaded, setPrimaryImageLoaded] = useState(!hasSeparatePreviewImage);
  const [primaryImageFailed, setPrimaryImageFailed] = useState(false);


  const revealGallery = useCallback(() => {
    setShowGallery(true);
  }, []);

  useEffect(() => {
    if (!hasGallery) {
      return;
    }

    const currentSection = sectionRef.current;
    if (!currentSection) {
      return;
    }

    if (typeof window.IntersectionObserver === 'function') {
      const observer = new window.IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            revealGallery();
            observer.disconnect();
          }
        },
        { rootMargin: '160px' },
      );

      observer.observe(currentSection);
      return () => observer.disconnect();
    }

    if (typeof window.requestIdleCallback === 'function') {
      const idleHandle = window.requestIdleCallback(() => {
        revealGallery();
      }, { timeout: 1500 });

      return () => {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleHandle);
        }
      };
    }

    const timeoutHandle = window.setTimeout(() => {
      revealGallery();
    }, 900);

    return () => window.clearTimeout(timeoutHandle);
  }, [hasGallery, revealGallery]);


  return (
    <div ref={sectionRef} className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-sm font-black text-gray-800">📸 업소 사진</h2>
        <span className="text-[11px] text-gray-400">갤러리 {dedupedGalleryImages.length}장</span>
      </div>
      <div className="space-y-3">
        {/* Main Photo (대표) */}
        <div className="relative overflow-hidden rounded-xl bg-slate-100 aspect-[16/9]">
          <span className="absolute left-2 top-2 z-10 rounded bg-blue-700 px-2 py-1 text-xs font-bold text-white shadow-sm">
            대표
          </span>
          {hasSeparatePreviewImage ? (
            <img
              src={previewImageUrl}
              alt={`${shopName} 미리보기 이미지`}
              className="absolute inset-0 h-full w-full object-contain object-center"
              loading="eager"
              decoding="async"
              fetchPriority="low"
            />
          ) : null}
          {!primaryImageFailed ? (
            <img
              src={primaryImageUrl}
              alt={`${shopName} 대표 이미지`}
              className={`absolute inset-0 h-full w-full object-contain object-center transition-opacity duration-200 ${primaryImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={() => setPrimaryImageLoaded(true)}
              onError={() => {
                if (hasSeparatePreviewImage) {
                  setPrimaryImageFailed(true);
                }
              }}
            />
          ) : null}
        </div>

        {/* Gallery Photos */}
        {hasGallery && showGallery ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleGalleryImages.map((imageUrl, index) => (
              <div key={`${imageUrl.slice(0, 40)}-${index}`} className="relative overflow-hidden rounded-xl border border-gray-100 bg-slate-100 aspect-[4/3]">
                <img
                  src={imageUrl}
                  alt={`${shopName} 갤러리 ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-contain object-center"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
              </div>
            ))}
          </div>
        ) : null}

        {hasGallery ? (
          showGallery ? (
            hasMoreGalleryImages ? (
              <button
                type="button"
                onClick={() => setVisibleCount((current) => current + INITIAL_VISIBLE_GALLERY_IMAGES)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-[var(--portal-brand)] hover:text-[var(--portal-brand)]"
              >
                사진 {remainingImageCount}장 더 보기
              </button>
            ) : null
          ) : (
            <button
              type="button"
              onClick={revealGallery}
              className="flex w-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-[var(--portal-brand)] hover:text-[var(--portal-brand)]"
            >
              추가 사진 {dedupedGalleryImages.length}장 불러오기
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
