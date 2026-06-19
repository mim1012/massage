import { revalidateTag, unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/prisma';

export interface ThemeItem {
  code: string;
  label: string;
  emoji: string;
}

const SELECT = { code: true, label: true, emoji: true } as const;

const PUBLIC_THEMES_CACHE_TAG = 'public-themes';

function isMissingNextCacheContextError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes('static generation store missing') || error.message.includes('incrementalCache missing'))
  );
}

function invalidateThemeCache() {
  try {
    revalidateTag(PUBLIC_THEMES_CACHE_TAG, 'max');
  } catch (error) {
    if (!isMissingNextCacheContextError(error)) {
      throw error;
    }
  }
}

async function listThemesUncached(): Promise<ThemeItem[]> {
  return prisma.theme.findMany({ orderBy: { sortOrder: 'asc' }, select: SELECT });
}

const getPersistentThemeList = unstable_cache(listThemesUncached, [PUBLIC_THEMES_CACHE_TAG], {
  revalidate: 300,
  tags: [PUBLIC_THEMES_CACHE_TAG],
});

export async function listThemes(): Promise<ThemeItem[]> {
  try {
    return await getPersistentThemeList();
  } catch (error) {
    if (isMissingNextCacheContextError(error)) {
      return listThemesUncached();
    }

    throw error;
  }
}

export async function addTheme(
  item: ThemeItem,
): Promise<{ ok: true; theme: ThemeItem } | { ok: false; error: string }> {
  const code = item.code.trim().toLowerCase();
  if (!code) return { ok: false, error: 'code가 필요합니다.' };

  const existing = await prisma.theme.findUnique({ where: { code } });
  if (existing) return { ok: false, error: '이미 존재하는 코드입니다.' };

  const agg = await prisma.theme.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (agg._max.sortOrder ?? -1) + 1;

  const theme = await prisma.theme.create({
    data: { code, label: item.label.trim(), emoji: item.emoji.trim(), sortOrder },
    select: SELECT,
  });
  invalidateThemeCache();
  return { ok: true, theme };
}

export async function deleteTheme(code: string): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const normalizedCode = code.trim();
  const referencedShops = await prisma.shop.count({ where: { theme: normalizedCode } });
  if (referencedShops > 0) {
    return { ok: false, status: 409, error: '사용 중인 테마는 삭제할 수 없습니다.' };
  }

  try {
    await prisma.theme.delete({ where: { code: normalizedCode } });
    invalidateThemeCache();
    return { ok: true };
  } catch {
    return { ok: false, status: 404, error: '존재하지 않는 테마입니다.' };
  }
}
