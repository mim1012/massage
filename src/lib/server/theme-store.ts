import { THEMES } from '@/lib/catalog';

export interface ThemeItem {
  code: string;
  label: string;
  emoji: string;
}

const DEFAULT_EMOJI: Record<string, string> = {
  all: '',
  swedish: '🌿',
  aroma: '🌸',
  thai: '🙏',
  sport: '💪',
  deep: '🔥',
  hot_stone: '💎',
  foot: '🦶',
  couple: '👫',
  geonma: '💆',
};

const globalForThemes = globalThis as typeof globalThis & {
  __themeStore?: ThemeItem[];
};

function initThemes(): ThemeItem[] {
  return THEMES.filter((t) => t.code !== 'all').map((t) => ({
    code: t.code,
    label: t.label,
    emoji: DEFAULT_EMOJI[t.code] ?? '',
  }));
}

function getStore(): ThemeItem[] {
  if (!globalForThemes.__themeStore) {
    globalForThemes.__themeStore = initThemes();
  }
  return globalForThemes.__themeStore;
}

export function listThemes(): ThemeItem[] {
  return [...getStore()];
}

export function addTheme(item: ThemeItem): { ok: true; theme: ThemeItem } | { ok: false; error: string } {
  const store = getStore();
  const code = item.code.trim().toLowerCase();
  if (!code) return { ok: false, error: 'code가 필요합니다.' };
  if (store.some((t) => t.code === code)) return { ok: false, error: '이미 존재하는 코드입니다.' };
  const theme: ThemeItem = { code, label: item.label.trim(), emoji: item.emoji.trim() };
  store.push(theme);
  return { ok: true, theme };
}

export function deleteTheme(code: string): boolean {
  const store = getStore();
  const idx = store.findIndex((t) => t.code === code);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
}
