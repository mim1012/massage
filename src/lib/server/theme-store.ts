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

export async function deleteTheme(code: string): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const normalizedCode = code.trim();
  const referencedShops = await prisma.shop.count({ where: { theme: normalizedCode } });
  if (referencedShops > 0) {
    return { ok: false, status: 409, error: '사용 중인 테마는 삭제할 수 없습니다.' };
  }

  try {
    await prisma.theme.delete({ where: { code: normalizedCode } });
    return { ok: true };
  } catch {
    return { ok: false, status: 404, error: '존재하지 않는 테마입니다.' };
  }
}
