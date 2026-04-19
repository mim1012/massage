import { QnaStatus, type Notice as DbNotice, type QnA as DbQnA, type Review as DbReview } from '@prisma/client';
import type { Notice, QnA, Review, Shop } from '@/lib/types';
import type { AdminDashboardData, AdminShopListItem, PremiumBoardData } from '@/lib/communityTypes';
import { prisma } from '@/lib/db/prisma';
import { mapShop, shopInclude } from '@/lib/server/shop-store';

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

function mapNotice(notice: DbNotice): Notice {
  return {
    id: notice.id,
    title: notice.title,
    content: notice.content,
    isPinned: notice.isPinned,
    createdAt: notice.createdAt.toISOString(),
  };
}

function mapQna(entry: DbQnA): QnA {
  return {
    id: entry.id,
    shopId: entry.shopId ?? undefined,
    question: entry.question,
    answer: entry.answer ?? undefined,
    authorName: entry.authorName,
    isAnswered: entry.status === QnaStatus.ANSWERED || Boolean(entry.answer),
    createdAt: entry.createdAt.toISOString(),
  };
}

function mapReview(review: DbReview & { shop: { name: string } }): Review {
  return {
    id: review.id,
    shopId: review.shopId,
    shopName: review.shop.name,
    authorName: review.authorName,
    rating: review.rating,
    content: review.content,
    createdAt: review.createdAt.toISOString(),
  };
}

function parseInteger(value: string) {
  const parsed = Number.parseInt(value.replace(/\D/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildShopPayload(input: Shop) {
  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    region: input.region,
    regionLabel: input.regionLabel,
    subRegion: input.subRegion?.trim() ? input.subRegion.trim() : null,
    subRegionLabel: input.subRegionLabel?.trim() ? input.subRegionLabel.trim() : null,
    theme: input.theme,
    themeLabel: input.themeLabel,
    tagline: input.tagline.trim(),
    description: input.description.trim(),
    address: input.address.trim(),
    phone: input.phone.trim(),
    hours: input.hours.trim(),
    isVisible: input.isVisible,
    isPremium: input.isPremium,
    premiumOrder: input.isPremium ? input.premiumOrder ?? 1 : null,
    thumbnailUrl: input.thumbnailUrl.trim() || null,
    bannerUrl: input.bannerUrl.trim() || null,
    ownerId: input.ownerId?.trim() ? input.ownerId.trim() : null,
    rating: input.rating,
    tags: input.tags,
  };
}

export async function listAdminShops() {
  const shops = await prisma.shop.findMany({
    include: shopInclude,
    orderBy: [{ isPremium: 'desc' }, { premiumOrder: 'asc' }, { name: 'asc' }],
  });

  return shops.map((shop) => mapShopForAdmin(mapShop(shop)));
}

export async function updatePremiumOrder(orderedIds: string[]) {
  const existingShops = await prisma.shop.findMany({ select: { id: true } });
  const existingIds = new Set(existingShops.map((shop) => shop.id));
  const validIds = Array.from(new Set(orderedIds.filter((id) => existingIds.has(id))));

  await prisma.$transaction([
    prisma.shop.updateMany({
      where: validIds.length > 0 ? { id: { notIn: validIds }, isPremium: true } : { isPremium: true },
      data: { isPremium: false, premiumOrder: null },
    }),
    ...validIds.map((id, index) =>
      prisma.shop.update({
        where: { id },
        data: { isPremium: true, premiumOrder: index + 1 },
      }),
    ),
  ]);

  return await getPremiumBoardData();
}

export async function getPremiumBoardData(): Promise<PremiumBoardData> {
  const shops = await listAdminShops();

  return {
    premiumShops: shops.filter((shop) => shop.isPremium),
    availableShops: shops.filter((shop) => !shop.isPremium),
  };
}

export async function listNotices() {
  const notices = await prisma.notice.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  });

  return notices.map(mapNotice);
}

export async function getNoticeById(id: string) {
  const notice = await prisma.notice.findUnique({ where: { id } });
  return notice ? mapNotice(notice) : null;
}

export async function createNotice(
  input: Pick<Notice, 'title' | 'content' | 'isPinned'> & { createdBy: string },
) {
  const notice = await prisma.notice.create({
    data: {
      title: input.title.trim(),
      content: input.content.trim(),
      isPinned: input.isPinned,
      createdBy: input.createdBy,
    },
  });

  return mapNotice(notice);
}

export async function updateNotice(id: string, input: Pick<Notice, 'title' | 'content' | 'isPinned'>) {
  try {
    const notice = await prisma.notice.update({
      where: { id },
      data: {
        title: input.title.trim(),
        content: input.content.trim(),
        isPinned: input.isPinned,
      },
    });

    return mapNotice(notice);
  } catch {
    return null;
  }
}

export async function deleteNotice(id: string) {
  try {
    await prisma.notice.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function listQna(shopId?: string) {
  const entries = await prisma.qnA.findMany({
    where: shopId ? { shopId } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return entries.map(mapQna);
}

export async function answerQna(id: string, answer: string, answeredBy?: string) {
  try {
    const entry = await prisma.qnA.update({
      where: { id },
      data: {
        answer: answer.trim(),
        answeredBy: answeredBy ?? null,
        answeredAt: new Date(),
        status: QnaStatus.ANSWERED,
      },
    });

    return mapQna(entry);
  } catch {
    return null;
  }
}

export async function createQna(
  input: Pick<QnA, 'question' | 'authorName'> & { shopId?: string; userId?: string },
) {
  const entry = await prisma.qnA.create({
    data: {
      question: input.question.trim(),
      authorName: input.authorName.trim(),
      shopId: input.shopId?.trim() || null,
      userId: input.userId?.trim() || null,
      status: QnaStatus.OPEN,
    },
  });

  return mapQna(entry);
}

export async function listReviews(limit?: number) {
  const reviews = await prisma.review.findMany({
    include: { shop: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    ...(typeof limit === 'number' ? { take: limit } : {}),
  });

  return reviews.map(mapReview);
}

export async function getAdminShopById(id: string) {
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: shopInclude,
  });

  return shop ? mapShop(shop) : null;
}

export async function getAdminShopOwnerId(id: string) {
  const shop = await prisma.shop.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  return shop?.ownerId ?? null;
}

export async function getQnaShopOwnerId(id: string) {
  const qna = await prisma.qnA.findUnique({
    where: { id },
    select: {
      shop: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!qna) {
    return { exists: false, ownerId: null };
  }

  return {
    exists: true,
    ownerId: qna.shop?.ownerId ?? null,
  };
}

export async function createAdminShop(input: Shop) {
  const shop = await prisma.shop.create({
    data: {
      ...buildShopPayload(input),
      images: {
        create: input.images.map((imageUrl, index) => ({
          imageUrl,
          sortOrder: index,
        })),
      },
      courses: {
        create: input.courses.map((course, index) => ({
          name: course.name.trim(),
          durationMinutes: parseInteger(course.duration),
          price: parseInteger(course.price),
          description: course.description?.trim() || null,
          sortOrder: index,
        })),
      },
    },
    include: shopInclude,
  });

  return mapShop(shop);
}

export async function updateAdminShop(id: string, input: Shop) {
  try {
    const shop = await prisma.shop.update({
      where: { id },
      data: {
        ...buildShopPayload(input),
        images: {
          deleteMany: {},
          create: input.images.map((imageUrl, index) => ({
            imageUrl,
            sortOrder: index,
          })),
        },
        courses: {
          deleteMany: {},
          create: input.courses.map((course, index) => ({
            name: course.name.trim(),
            durationMinutes: parseInteger(course.duration),
            price: parseInteger(course.price),
            description: course.description?.trim() || null,
            sortOrder: index,
          })),
        },
      },
      include: shopInclude,
    });

    return mapShop(shop);
  } catch {
    return null;
  }
}

export async function getBoardSummary() {
  const [notices, qna, reviews] = await Promise.all([
    prisma.notice.count(),
    prisma.qnA.count(),
    prisma.review.count(),
  ]);

  return {
    notices,
    qna,
    reviews,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [shopCount, premiumCount, unansweredCount, noticeCount, pendingQna, recentReviews] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.count({ where: { isPremium: true } }),
    prisma.qnA.count({ where: { status: QnaStatus.OPEN } }),
    prisma.notice.count(),
    prisma.qnA.findMany({
      where: { status: QnaStatus.OPEN },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.review.findMany({
      include: { shop: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ]);

  return {
    summary: [
      { label: '전체 업소', value: shopCount },
      { label: '프리미엄 업소', value: premiumCount },
      { label: '미답변 Q&A', value: unansweredCount },
      { label: '공지 수', value: noticeCount },
    ],
    pendingQna: pendingQna.map((item) => ({
      id: item.id,
      question: item.question,
      isAnswered: false,
    })),
    recentReviews: recentReviews.map((item) => ({
      id: item.id,
      shopName: item.shop.name,
      rating: item.rating,
      content: item.content,
    })),
  };
}
