import { prisma } from '@/lib/db/prisma';

export interface ThemeItem {
  code: string;
  label: string;
  emoji: string;
}

const SELECT = { code: true, label: true, emoji: true } as const;

export async function listThemes(): Promise<ThemeItem[]> {
  return prisma.theme.findMany({ orderBy: { sortOrder: 'asc' }, select: SELECT });
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
  return { ok: true, theme };
}

export async function deleteTheme(code: string): Promise<boolean> {
  try {
    await prisma.theme.delete({ where: { code: code.trim() } });
    return true;
  } catch {
    return false;
  }
}
