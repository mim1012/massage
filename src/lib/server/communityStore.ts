import type { Notice, QnA, Review, Shop } from '@/lib/types';
import type { AdminDashboardData, AdminShopListItem, PremiumBoardData } from '@/lib/communityTypes';
import { getStore } from '@/lib/server/mock-store';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mapShopForAdmin(shop: Shop): AdminShopListItem {
  return {
    id: shop.id,
    name: shop.name,
    region: shop.region,
    regionLabel: shop.regionLabel,
    subRegion: shop.subRegion,
    subRegionLabel: shop.subRegionLabel,
    theme: shop.theme,
    themeLabel: shop.themeLabel,
    phone: shop.phone,
    isVisible: shop.isVisible,
    isPremium: shop.isPremium,
    premiumOrder: shop.premiumOrder,
    ownerId: shop.ownerId,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  };
}

function sortNotices(notices: Notice[]) {
  return [...notices].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return Number(right.isPinned) - Number(left.isPinned);
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function sortReviews(reviews: Review[]) {
  return [...reviews].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function sortQna(entries: QnA[]) {
  return [...entries].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function listAdminShops() {
  const { shops } = getStore();

  return clone(
    shops
      .map(mapShopForAdmin)
      .sort((left, right) => {
        if (left.isPremium !== right.isPremium) {
          return Number(right.isPremium) - Number(left.isPremium);
        }

        if (left.isPremium && right.isPremium) {
          return (left.premiumOrder ?? Number.MAX_SAFE_INTEGER) - (right.premiumOrder ?? Number.MAX_SAFE_INTEGER);
        }

        return left.name.localeCompare(right.name);
      }),
  );
}

export function updatePremiumOrder(orderedIds: string[]) {
  const { shops } = getStore();
  const now = new Date().toISOString();
  const premiumIds = Array.from(new Set(orderedIds)).filter((id) => shops.some((shop) => shop.id === id));

  shops.forEach((shop) => {
    const index = premiumIds.indexOf(shop.id);
    if (index >= 0) {
      shop.isPremium = true;
      shop.premiumOrder = index + 1;
      shop.updatedAt = now;
      return;
    }

    if (shop.isPremium) {
      shop.isPremium = false;
      shop.premiumOrder = undefined;
      shop.updatedAt = now;
    }
  });

  return getPremiumBoardData();
}

export function getPremiumBoardData(): PremiumBoardData {
  const shops = listAdminShops();

  return {
    premiumShops: shops.filter((shop) => shop.isPremium),
    availableShops: shops.filter((shop) => !shop.isPremium),
  };
}

export function listNotices() {
  const { notices } = getStore();
  return clone(sortNotices(notices));
}

export function getNoticeById(id: string) {
  const { notices } = getStore();
  return clone(notices.find((notice) => notice.id === id) ?? null);
}

export function createNotice(input: Pick<Notice, 'title' | 'content' | 'isPinned'>) {
  const { notices } = getStore();
  const notice: Notice = {
    id: `notice-${Date.now()}`,
    title: input.title.trim(),
    content: input.content.trim(),
    isPinned: input.isPinned,
    createdAt: new Date().toISOString(),
  };

  notices.unshift(notice);
  return clone(notice);
}

export function updateNotice(id: string, input: Pick<Notice, 'title' | 'content' | 'isPinned'>) {
  const { notices } = getStore();
  const notice = notices.find((item) => item.id === id);
  if (!notice) {
    return null;
  }

  notice.title = input.title.trim();
  notice.content = input.content.trim();
  notice.isPinned = input.isPinned;
  return clone(notice);
}

export function deleteNotice(id: string) {
  const { notices } = getStore();
  const index = notices.findIndex((notice) => notice.id === id);
  if (index < 0) {
    return false;
  }

  notices.splice(index, 1);
  return true;
}

export function listQna(shopId?: string) {
  const { qna } = getStore();
  const entries = shopId ? qna.filter((item) => item.shopId === shopId) : qna;
  return clone(sortQna(entries));
}

export function answerQna(id: string, answer: string) {
  const { qna } = getStore();
  const entry = qna.find((item) => item.id === id);
  if (!entry) {
    return null;
  }

  entry.answer = answer.trim();
  entry.isAnswered = true;
  return clone(entry);
}

export function createQna(input: Pick<QnA, 'question' | 'authorName'> & { shopId?: string }) {
  const { qna } = getStore();
  const entry: QnA = {
    id: `qna-${Date.now()}`,
    shopId: input.shopId,
    question: input.question.trim(),
    authorName: input.authorName.trim(),
    isAnswered: false,
    createdAt: new Date().toISOString(),
  };

  qna.unshift(entry);
  return clone(entry);
}

export function listReviews(limit?: number) {
  const { reviews } = getStore();
  const sorted = sortReviews(reviews);
  return clone(typeof limit === 'number' ? sorted.slice(0, limit) : sorted);
}

export function getAdminShopById(id: string) {
  const { shops } = getStore();
  return clone(shops.find((shop) => shop.id === id) ?? null);
}

export function createAdminShop(input: Shop) {
  const { shops } = getStore();
  shops.unshift(clone(input));
  return clone(input);
}

export function updateAdminShop(id: string, input: Shop) {
  const { shops } = getStore();
  const index = shops.findIndex((shop) => shop.id === id);
  if (index < 0) {
    return null;
  }

  shops[index] = clone(input);
  return clone(shops[index]);
}

export function getBoardSummary() {
  const { notices, qna, reviews } = getStore();

  return {
    notices: notices.length,
    qna: qna.length,
    reviews: reviews.length,
  };
}

export function getAdminDashboardData(): AdminDashboardData {
  const { shops, notices, qna, reviews } = getStore();

  return {
    summary: [
      { label: '전체 업소', value: shops.length },
      { label: '프리미엄 업소', value: shops.filter((shop) => shop.isPremium).length },
      { label: '미답변 Q&A', value: qna.filter((item) => !item.isAnswered).length },
      { label: '공지 수', value: notices.length },
    ],
    pendingQna: sortQna(qna)
      .filter((item) => !item.isAnswered)
      .slice(0, 4)
      .map((item) => ({ id: item.id, question: item.question, isAnswered: item.isAnswered })),
    recentReviews: sortReviews(reviews)
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        shopName: item.shopName,
        rating: item.rating,
        content: item.content,
      })),
  };
}
