import { revalidateTag, unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { withDatabaseRetry } from '@/lib/db/retry';

export type AdBannerSlotKey = 'detail' | 'sidebar' | 'mobile';

export const AD_BANNER_SLOTS: AdBannerSlotKey[] = ['detail', 'sidebar', 'mobile'];

export type AdBannerRecord = {
  slot: string;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
};

export type PublicAdBanner = { imageUrl: string; linkUrl: string | null };

const AD_BANNERS_CACHE_TAG = 'ad-banners';

function isMissingNextCacheContextError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes('static generation store missing') || error.message.includes('incrementalCache missing'))
  );
}

async function loadActiveAdBanners(): Promise<Record<string, PublicAdBanner>> {
  const rows = await withDatabaseRetry(() => prisma.adBanner.findMany({ where: { isActive: true } }));
  const map: Record<string, PublicAdBanner> = {};
  for (const row of rows) {
    if (row.imageUrl) {
      map[row.slot] = { imageUrl: row.imageUrl, linkUrl: row.linkUrl };
    }
  }
  return map;
}

const getCachedActiveAdBanners = unstable_cache(loadActiveAdBanners, [AD_BANNERS_CACHE_TAG], {
  revalidate: 60,
  tags: [AD_BANNERS_CACHE_TAG],
});

export async function listActiveAdBanners(): Promise<Record<string, PublicAdBanner>> {
  try {
    return await getCachedActiveAdBanners();
  } catch (error) {
    if (isMissingNextCacheContextError(error)) {
      return loadActiveAdBanners();
    }
    throw error;
  }
}

export async function listAllAdBanners(): Promise<AdBannerRecord[]> {
  const rows = await withDatabaseRetry(() => prisma.adBanner.findMany());
  const bySlot = new Map(rows.map((row) => [row.slot, row]));
  return AD_BANNER_SLOTS.map((slot) => {
    const row = bySlot.get(slot);
    return {
      slot,
      imageUrl: row?.imageUrl ?? '',
      linkUrl: row?.linkUrl ?? null,
      isActive: row?.isActive ?? false,
    };
  });
}

export async function upsertAdBanner(
  slot: string,
  input: { imageUrl?: string; linkUrl?: string | null; isActive?: boolean },
): Promise<AdBannerRecord> {
  if (!AD_BANNER_SLOTS.includes(slot as AdBannerSlotKey)) {
    throw new Error('INVALID_AD_SLOT');
  }

  const data = {
    imageUrl: input.imageUrl?.trim() ?? '',
    linkUrl: input.linkUrl?.trim() || null,
    isActive: input.isActive ?? true,
  };

  const saved = await withDatabaseRetry(() =>
    prisma.adBanner.upsert({
      where: { slot },
      update: data,
      create: { slot, ...data },
    }),
  );

  try {
    revalidateTag(AD_BANNERS_CACHE_TAG, 'max');
  } catch (error) {
    if (!isMissingNextCacheContextError(error)) {
      throw error;
    }
  }

  return { slot: saved.slot, imageUrl: saved.imageUrl, linkUrl: saved.linkUrl, isActive: saved.isActive };
}
