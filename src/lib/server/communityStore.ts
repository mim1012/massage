import {
  QnaStatus,
  type Notice as DbNotice,
  type PartnershipInquiry as DbPartnershipInquiry,
  type QnA as DbQnA,
  type Review as DbReview,
  type SiteSettings as DbSiteSettings,
} from '@prisma/client';
import type { HomeSeoContent, Notice, PartnershipInquiry, QnA, Review, Shop, SiteSettings, UserRole } from '@/lib/types';
import type { AdminDashboardData, AdminShopListItem, AdminStatsData, PremiumBoardData } from '@/lib/communityTypes';
import { prisma } from '@/lib/db/prisma';
import {
  normalizeHomeSeo,
  normalizeSiteSettings,
} from '@/lib/site-content-defaults';
import { mapShop, shopInclude } from '@/lib/server/shop-store';

const SITE_SETTINGS_ID = 'default';

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
    isHidden: review.isHidden,
    createdAt: review.createdAt.toISOString(),
  };
}

function mapPartnershipInquiry(entry: DbPartnershipInquiry): PartnershipInquiry {
  const statusMap = {
    PENDING: 'pending',
    CONTACTED: 'contacted',
    COMPLETED: 'completed',
  } as const;

  return {
    id: entry.id,
    shopName: entry.shopName,
    region: entry.region,
    subRegion: entry.subRegion,
    theme: entry.theme,
    contactName: entry.contactName,
    phone: entry.phone,
    kakaoId: entry.kakaoId ?? undefined,
    message: entry.message,
    status: statusMap[entry.status],
    createdAt: entry.createdAt.toISOString(),
  };
}

function mapPartnershipStatus(status: PartnershipInquiry['status']) {
  switch (status) {
    case 'contacted':
      return 'CONTACTED';
    case 'completed':
      return 'COMPLETED';
    case 'pending':
    default:
      return 'PENDING';
  }
}

function mapSiteSettings(record: DbSiteSettings) {
  const siteSettings = normalizeSiteSettings({
    siteName: record.siteName,
    siteTitle: record.siteTitle,
    siteDescription: record.siteDescription,
    heroMainText: record.heroMainText,
    heroSubText: record.heroSubText,
    contactPhone: record.contactPhone,
    footerInfo: record.footerInfo,
  });

  const homeSeo = normalizeHomeSeo({
    section1Title: record.seoSection1Title,
    section1Content: record.seoSection1Content,
    section2Title: record.seoSection2Title,
    section2Content: record.seoSection2Content,
    section3Title: record.seoSection3Title,
    section3Content: record.seoSection3Content,
  });

  return { siteSettings, homeSeo };
}

function parseInteger(value: string) {
  const parsed = Number.parseInt(value.replace(/\D/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildShopImages(images: string[]) {
  return images.map((imageUrl, index) => ({
    imageUrl,
    sortOrder: index,
  }));
}

function buildShopCourses(courses: Shop['courses']) {
  return courses.map((course, index) => ({
    name: course.name.trim(),
    durationMinutes: parseInteger(course.duration),
    price: parseInteger(course.price),
    description: course.description?.trim() || null,
    sortOrder: index,
  }));
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
  const existingNotice = await prisma.notice.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingNotice) {
    return null;
  }

  const notice = await prisma.notice.update({
    where: { id },
    data: {
      title: input.title.trim(),
      content: input.content.trim(),
      isPinned: input.isPinned,
    },
  });

  return mapNotice(notice);
}

export async function deleteNotice(id: string) {
  const result = await prisma.notice.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function listQna(shopId?: string) {
  const entries = await prisma.qnA.findMany({
    where: shopId ? { shopId } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return entries.map(mapQna);
}

export async function answerQna(id: string, answer: string, answeredBy?: string) {
  const existingEntry = await prisma.qnA.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingEntry) {
    return null;
  }

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

type ReviewListOptions = {
  limit?: number;
  shopId?: string;
};

async function refreshShopReviewRating(shopId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { shopId },
    _avg: { rating: true },
  });

  await prisma.shop.update({
    where: { id: shopId },
    data: { rating: aggregate._avg.rating ?? 0 },
  });
}

export async function createReview(input: {
  shopId: string;
  userId: string;
  authorName: string;
  rating: number;
  content: string;
}) {
  const review = await prisma.review.create({
    data: {
      shopId: input.shopId,
      userId: input.userId,
      authorName: input.authorName.trim(),
      rating: input.rating,
      content: input.content.trim(),
    },
    include: { shop: { select: { name: true } } },
  });

  await refreshShopReviewRating(input.shopId);
  return mapReview(review);
}

export async function listReviews(options: number | ReviewListOptions = {}) {
  const normalizedOptions =
    typeof options === 'number'
      ? { limit: options }
      : options;

  const reviews = await prisma.review.findMany({
    where: {
      isHidden: false,
      ...(normalizedOptions.shopId ? { shopId: normalizedOptions.shopId } : {}),
    },
    include: { shop: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    ...(typeof normalizedOptions.limit === 'number' ? { take: normalizedOptions.limit } : {}),
  });

  return reviews.map(mapReview);
}

export async function listManagedReviews(user: { id: string; role: UserRole }) {
  const reviewWhere =
    user.role === 'ADMIN'
      ? undefined
      : {
          shop: {
            ownerId: user.id,
          },
        };

  const reviews = await prisma.review.findMany({
    where: reviewWhere,
    include: { shop: { select: { name: true, regionLabel: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return reviews.map((review) => ({
    ...mapReview(review),
    shopRegionLabel: review.shop.regionLabel,
  }));
}

export async function setReviewHiddenState(
  user: { id: string; role: UserRole },
  reviewId: string,
  isHidden: boolean,
) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      shop: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!review) {
    return null;
  }

  if (user.role !== 'ADMIN' && review.shop.ownerId !== user.id) {
    return null;
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden },
    include: { shop: { select: { name: true } } },
  });

  return mapReview(updated);
}

export async function deleteManagedReview(user: { id: string; role: UserRole }, reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      shop: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!review) {
    return false;
  }

  if (user.role !== 'ADMIN' && review.shop.ownerId !== user.id) {
    return false;
  }

  await prisma.review.delete({ where: { id: reviewId } });
  await refreshShopReviewRating(review.shopId);
  return true;
}

export async function getAdminShopById(id: string) {
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: shopInclude,
  });

  return shop ? mapShop(shop) : null;
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
        create: buildShopImages(input.images),
      },
      courses: {
        create: buildShopCourses(input.courses),
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
          create: buildShopImages(input.images),
        },
        courses: {
          deleteMany: {},
          create: buildShopCourses(input.courses),
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
    prisma.review.count({ where: { isHidden: false } }),
  ]);

  return {
    notices,
    qna,
    reviews,
  };
}

export async function listPartnershipInquiries() {
  const entries = await prisma.partnershipInquiry.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return entries.map(mapPartnershipInquiry);
}

export async function createPartnershipInquiry(
  input: Omit<PartnershipInquiry, 'id' | 'createdAt' | 'status'> & { status?: PartnershipInquiry['status'] },
) {
  const entry = await prisma.partnershipInquiry.create({
    data: {
      shopName: input.shopName.trim(),
      region: input.region.trim(),
      subRegion: input.subRegion.trim(),
      theme: input.theme.trim(),
      contactName: input.contactName.trim(),
      phone: input.phone.trim(),
      kakaoId: input.kakaoId?.trim() || null,
      message: input.message.trim(),
      status: mapPartnershipStatus(input.status ?? 'pending'),
    },
  });

  return mapPartnershipInquiry(entry);
}

export async function updatePartnershipInquiryStatus(
  id: string,
  status: PartnershipInquiry['status'],
) {
  try {
    const entry = await prisma.partnershipInquiry.update({
      where: { id },
      data: { status: mapPartnershipStatus(status) },
    });

    return mapPartnershipInquiry(entry);
  } catch {
    return null;
  }
}

export async function deletePartnershipInquiry(id: string) {
  const result = await prisma.partnershipInquiry.deleteMany({
    where: { id },
  });

  return result.count > 0;
}

export async function getSiteContent() {
  const record = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });

  if (!record) {
    return null;
  }

  const content = mapSiteSettings(record);

  const hasLegacyContent =
    record.siteName !== content.siteSettings.siteName ||
    record.siteTitle !== content.siteSettings.siteTitle ||
    record.siteDescription !== content.siteSettings.siteDescription ||
    record.heroMainText !== content.siteSettings.heroMainText ||
    record.heroSubText !== content.siteSettings.heroSubText ||
    record.contactPhone !== content.siteSettings.contactPhone ||
    record.footerInfo !== content.siteSettings.footerInfo ||
    record.seoSection1Title !== content.homeSeo.section1Title ||
    record.seoSection1Content !== content.homeSeo.section1Content ||
    record.seoSection2Title !== content.homeSeo.section2Title ||
    record.seoSection2Content !== content.homeSeo.section2Content ||
    record.seoSection3Title !== content.homeSeo.section3Title ||
    record.seoSection3Content !== content.homeSeo.section3Content;

  if (hasLegacyContent) {
    await prisma.siteSettings.update({
      where: { id: SITE_SETTINGS_ID },
      data: {
        siteName: content.siteSettings.siteName,
        siteTitle: content.siteSettings.siteTitle,
        siteDescription: content.siteSettings.siteDescription,
        heroMainText: content.siteSettings.heroMainText,
        heroSubText: content.siteSettings.heroSubText,
        contactPhone: content.siteSettings.contactPhone,
        footerInfo: content.siteSettings.footerInfo,
        seoSection1Title: content.homeSeo.section1Title,
        seoSection1Content: content.homeSeo.section1Content,
        seoSection2Title: content.homeSeo.section2Title,
        seoSection2Content: content.homeSeo.section2Content,
        seoSection3Title: content.homeSeo.section3Title,
        seoSection3Content: content.homeSeo.section3Content,
      },
    });
  }

  return content;
}

export async function upsertSiteContent(input: SiteSettings & HomeSeoContent) {
  const record = await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    update: {
      siteName: input.siteName.trim(),
      siteTitle: input.siteTitle.trim(),
      siteDescription: input.siteDescription.trim(),
      heroMainText: input.heroMainText.trim(),
      heroSubText: input.heroSubText.trim(),
      contactPhone: input.contactPhone.trim(),
      footerInfo: input.footerInfo.trim(),
      seoSection1Title: input.section1Title.trim(),
      seoSection1Content: input.section1Content.trim(),
      seoSection2Title: input.section2Title.trim(),
      seoSection2Content: input.section2Content.trim(),
      seoSection3Title: input.section3Title.trim(),
      seoSection3Content: input.section3Content.trim(),
    },
    create: {
      id: SITE_SETTINGS_ID,
      siteName: input.siteName.trim(),
      siteTitle: input.siteTitle.trim(),
      siteDescription: input.siteDescription.trim(),
      heroMainText: input.heroMainText.trim(),
      heroSubText: input.heroSubText.trim(),
      contactPhone: input.contactPhone.trim(),
      footerInfo: input.footerInfo.trim(),
      seoSection1Title: input.section1Title.trim(),
      seoSection1Content: input.section1Content.trim(),
      seoSection2Title: input.section2Title.trim(),
      seoSection2Content: input.section2Content.trim(),
      seoSection3Title: input.section3Title.trim(),
      seoSection3Content: input.section3Content.trim(),
    },
  });

  return mapSiteSettings(record);
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

export async function getAdminStatsData(): Promise<AdminStatsData> {
  const [shopCount, premiumCount, unansweredCount, visibleReviewCount, topShops] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.count({ where: { isPremium: true } }),
    prisma.qnA.count({ where: { status: QnaStatus.OPEN } }),
    prisma.review.count({ where: { isHidden: false } }),
    prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        regionLabel: true,
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: [{ reviews: { _count: 'desc' } }, { name: 'asc' }],
      take: 5,
    }),
  ]);

  return {
    summary: [
      { label: '전체 업소', value: shopCount, helperText: '등록된 전체 업소 수' },
      { label: '프리미엄 업소', value: premiumCount, helperText: '상단 노출 중인 프리미엄 업소' },
      { label: '미답변 Q&A', value: unansweredCount, helperText: '아직 답변이 필요한 문의' },
      { label: '노출 중 리뷰', value: visibleReviewCount, helperText: '숨김 처리되지 않은 공개 리뷰' },
    ],
    topShops: topShops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      regionLabel: shop.regionLabel,
      viewCount: shop._count.reviews,
    })),
  };
}
