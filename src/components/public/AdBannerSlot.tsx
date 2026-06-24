'use client';

import { useEffect, useState } from 'react';

type Banner = { imageUrl: string; linkUrl?: string | null };

let bannersPromise: Promise<Record<string, Banner>> | null = null;

function loadAdBanners(): Promise<Record<string, Banner>> {
  if (!bannersPromise) {
    bannersPromise = fetch('/api/ad-banners')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => (data?.banners ?? {}) as Record<string, Banner>)
      .catch(() => ({}));
  }
  return bannersPromise;
}

type AdBannerSlotProps = {
  slot: string;
  heightClass: string;
  children: React.ReactNode;
};

export default function AdBannerSlot({ slot, heightClass, children }: AdBannerSlotProps) {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    let active = true;
    void loadAdBanners().then((map) => {
      if (active) {
        setBanner(map[slot] ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, [slot]);

  if (!banner?.imageUrl) {
    return <>{children}</>;
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={banner.imageUrl} alt="광고 배너" loading="lazy" className="h-full w-full object-cover" />
  );

  return (
    <div className={`${heightClass} w-full overflow-hidden rounded`}>
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}
