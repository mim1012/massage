import { revalidateTag, unstable_cache } from 'next/cache';
import {
  Prisma,
  QnaCommentRole,
  QnaStatus,
  UserRole as PrismaUserRole,
  UserStatus,
  type Notice as DbNotice,
  type PartnershipInquiry as DbPartnershipInquiry,
  type Review as DbReview,
  type SiteSettings as DbSiteSettings,
} from '@prisma/client';
import type {
  HomeSeoContent,
  Notice,
  PartnershipInquiry,
  QnA,
  QnAComment,
  Review,
  Shop,
  SiteSettings,
  UserRole,
} from '@/lib/types';
import type { AdminDashboardData, AdminShopListItem, AdminStatsData, PremiumBoardData } from '@/lib/communityTypes';
import { prisma } from '@/lib/db/prisma';
import {
  normalizeHomeSeo,
  normalizeSiteSettings,
} from '@/lib/site-content-defaults';
import { invalidatePublicShopListCache, mapShop, shopInclude } from '@/lib/server/shop-store';

const managedShopListSelect = {
  id: true,
  name: true,
  region: true,
  regionLabel: true,
  subRegion: true,
  subRegionLabel: true,
  theme: true,
  themeLabel: true,
  phone: true,
  isVisible: true,
  isPremium: true,
  premiumOrder: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ShopSelect;

type ManagedShopListRecord = Prisma.ShopGetPayload<{
  select: typeof managedShopListSelect;
}>;

const SITE_SETTINGS_ID = 'default';
const PUBLIC_SITE_CONTENT_CACHE_TAG = 'public-site-content';

let cachedPublicSiteContent:
  | {
      siteSettings: SiteSettings;
      homeSeo: HomeSeoContent;
    }
  | null
  | undefined;
let cachedBoardSummary: Promise<{ notices: number; qna: number; reviews: number }> | null = null;
const cachedPublicNoticeLists = new Map<string, Promise<Notice[]>>();
const cachedPublicReviewLists = new Map<string, Promise<Review[]>>();

const getPersistentPublicSiteContent = unstable_cache(
  async () => {
    try {
      const loaded = await loadSiteContentRecord();
      return loaded?.content ?? null;
    } catch {
      return null;
    }
  },
  [PUBLIC_SITE_CONTENT_CACHE_TAG],
  {
    revalidate: 60,
    tags: [PUBLIC_SITE_CONTENT_CACHE_TAG],
  },
);

function invalidatePublicBoardCaches() {
  cachedBoardSummary = null;
  cachedPublicNoticeLists.clear();
  cachedPublicReviewLists.clear();
}

function mapManagedShopRecordForAdmin(shop: ManagedShopListRecord): AdminShopListItem {
  return {
    id: shop.id,
    name: shop.name,
    region: shop.region,
    regionLabel: shop.regionLabel,
    subRegion: shop.subRegion ?? undefined,
    subRegionLabel: shop.subRegionLabel ?? undefined,
    theme: shop.theme,
    themeLabel: shop.themeLabel,
    phone: shop.phone,
    isVisible: shop.isVisible,
    isPremium: shop.isPremium,
    premiumOrder: shop.premiumOrder ?? undefined,
    ownerId: shop.ownerId ?? undefined,
    createdAt: shop.createdAt.toISOString(),
    updatedAt: shop.updatedAt.toISOString(),
  };
}

type ViewerContext = {
  id: string;
  role: UserRole;
};

type QnaRecord = Prisma.QnAGetPayload<{
  include: {
    shop: {
      select: {
        ownerId: true;
        name: true;
        regionLabel: true;
      };
    };
    comments: {
      orderBy: {
        createdAt: 'asc';
      };
    };
  };
}>;

type LegacyQnaRecord = Prisma.QnAGetPayload<{
  include: {
    shop: {
      select: {
        ownerId: true;
        name: true;
        regionLabel: true;
      };
    };
  };
}> & {
  comments: [];
};

type BoardLandingQnaRecord = Prisma.QnAGetPayload<{
  select: {
    id: true;
    shopId: true;
    question: true;
    authorName: true;
    status: true;
    createdAt: true;
    shop: {
      select: {
        ownerId: true;
        name: true;
        regionLabel: true;
      };
    };
    comments: {
      select: {
        content: true;
        createdAt: true;
      };
      orderBy: {
        createdAt: 'desc';
      };
      take: 1;
    };
    _count: {
      select: {
        comments: true;
      };
    };
  };
}>;

type LegacyBoardLandingQnaRecord = Prisma.QnAGetPayload<{
  select: {
    id: true;
    shopId: true;
    question: true;
    authorName: true;
    status: true;
    createdAt: true;
    shop: {
      select: {
        ownerId: true;
        name: true;
        regionLabel: true;
      };
    };
  };
}>;

function buildContainsFilter(value: string) {
  return {
    contains: value,
    mode: Prisma.QueryMode.insensitive,
  } satisfies Prisma.StringFilter;
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

function mapQnaComment(comment: QnaRecord['comments'][number]): QnAComment {
  return {
    id: comment.id,
    qnaId: comment.qnaId,
    userId: comment.userId ?? undefined,
    authorName: comment.authorName,
    role: comment.role,
    authorRole: comment.role,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  };
}

function isQnaCommentStorageUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes('qna_comments') || message.includes('comments') || message.includes('column') || message.includes('relation');
}

async function loadLegacyQnaRecords(where: Prisma.QnAWhereInput) {
  const entries = await prisma.qnA.findMany({
    where,
    include: {
      shop: {
        select: {
          ownerId: true,
          name: true,
          regionLabel: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return entries.map((entry) => ({ ...entry, comments: [] as [] })) satisfies LegacyQnaRecord[];
}

function canCommentOnQna(entry: { shop?: { ownerId: string | null } | null }, viewer?: ViewerContext) {
  if (!viewer) return false;
  if (viewer.role === 'ADMIN') return true;
  return viewer.role === 'OWNER' && Boolean(entry.shop?.ownerId) && entry.shop?.ownerId === viewer.id;
}

function mapQna(entry: QnaRecord | LegacyQnaRecord, viewer?: ViewerContext): QnA {
  const comments = entry.comments.map(mapQnaComment);
  const latestComment = comments.at(-1);

  return {
    id: entry.id,
    shopId: entry.shopId ?? undefined,
    shopName: entry.shop?.name ?? undefined,
    shopRegionLabel: entry.shop?.regionLabel ?? undefined,
    question: entry.question,
    answer: latestComment?.content,
    authorName: entry.authorName,
    isAnswered: entry.status === QnaStatus.ANSWERED || comments.length > 0,
    canComment: canCommentOnQna(entry, viewer),
    commentCount: comments.length,
    latestCommentAt: latestComment?.createdAt,
    latestCommentPreview: latestComment?.content,
    comments,
    createdAt: entry.createdAt.toISOString(),
  };
}

function mapBoardLandingQna(entry: BoardLandingQnaRecord | LegacyBoardLandingQnaRecord, viewer?: ViewerContext): QnA {
  const latestComment = 'comments' in entry ? entry.comments[0] : undefined;
  const commentCount = '_count' in entry ? entry._count.comments : 0;

  return {
    id: entry.id,
    shopId: entry.shopId ?? undefined,
    shopName: entry.shop?.name ?? undefined,
    shopRegionLabel: entry.shop?.regionLabel ?? undefined,
    question: entry.question,
    answer: latestComment?.content,
    authorName: entry.authorName,
    isAnswered: entry.status === QnaStatus.ANSWERED || commentCount > 0,
    canComment: canCommentOnQna(entry, viewer),
    commentCount,
    latestCommentAt: latestComment?.createdAt.toISOString(),
    latestCommentPreview: latestComment?.content,
    comments: [],
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
    case 'contacted': return 'CONTACTED';
    case 'completed': return 'COMPLETED';
    default: return 'PENDING';
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

async function loadSiteContentRecord() {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
    });
    if (!record) return null;
    return { record, content: mapSiteSettings(record) };
  } catch (error) {
    return null;
  }
}

export async function listManagedShops(
  user: { id: string; role: UserRole },
  filters: { region?: string; q?: string } = {},
) {
  try {
    const where: Prisma.ShopWhereInput = {};
    if (user.role === 'OWNER') where.ownerId = user.id;
    if (filters.region && filters.region !== 'all') where.region = filters.region;
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { phone: { contains: filters.q, mode: 'insensitive' } },
      ];
    }
    const shops = await prisma.shop.findMany({
      where,
      select: managedShopListSelect,
      orderBy: [{ isPremium: 'desc' }, { premiumOrder: 'asc' }, { name: 'asc' }],
    });
    return shops.map(mapManagedShopRecordForAdmin);
  } catch (error) {
    return [];
  }
}

export async function updatePremiumOrder(orderedIds: string[]) {
  try {
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
  } catch {
    return { premiumShops: [], availableShops: [] };
  }
}

export async function getPremiumBoardData(): Promise<PremiumBoardData> {
  const shops = await listManagedShops({ id: 'admin', role: 'ADMIN' });
  return {
    premiumShops: shops.filter((shop) => shop.isPremium),
    availableShops: shops.filter((shop) => !shop.isPremium),
  };
}

export async function listNotices(options: { search?: string } = {}) {
  const search = options.search?.trim();
  const cacheKey = search ?? '__all__';
  const cached = cachedPublicNoticeLists.get(cacheKey);
  if (cached) return cached;

  const pending = prisma.notice
    .findMany({
      where: search ? { OR: [{ title: buildContainsFilter(search) }, { content: buildContainsFilter(search) }] } : undefined,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    })
    .then((notices) => notices.map(mapNotice))
    .catch((error) => {
      cachedPublicNoticeLists.delete(cacheKey);
      return [];
    });

  cachedPublicNoticeLists.set(cacheKey, pending);
  return pending;
}

export async function getNoticeById(id: string) {
  try {
    const notice = await prisma.notice.findUnique({ where: { id } });
    return notice ? mapNotice(notice) : null;
  } catch {
    return null;
  }
}

export async function createNotice(input: Pick<Notice, 'title' | 'content' | 'isPinned'> & { createdBy: string }) {
  try {
    const notice = await prisma.notice.create({
      data: { title: input.title.trim(), content: input.content.trim(), isPinned: input.isPinned, createdBy: input.createdBy },
    });
    invalidatePublicBoardCaches();
    return mapNotice(notice);
  } catch {
    return null;
  }
}

export async function deleteNotice(id: string) {
  try {
    const result = await prisma.notice.deleteMany({ where: { id } });
    if (result.count > 0) invalidatePublicBoardCaches();
    return result.count > 0;
  } catch {
    return false;
  }
}

export async function listQna(options: string | { shopId?: string; search?: string; viewer?: ViewerContext } = {}) {
  const normalizedOptions = typeof options === 'string' ? { shopId: options } : options;
  const shopId = normalizedOptions.shopId?.trim();
  const search = normalizedOptions.search?.trim();
  const where: Prisma.QnAWhereInput = {
    ...(shopId ? { shopId } : {}),
    ...(search ? { OR: [{ question: buildContainsFilter(search) }, { authorName: buildContainsFilter(search) }, { comments: { some: { content: buildContainsFilter(search) } } }] } : {}),
  };

  try {
    const entries = await prisma.qnA.findMany({ where, include: qnaInclude, orderBy: { createdAt: 'desc' } });
    return entries.map((entry) => mapQna(entry, normalizedOptions.viewer));
  } catch (error) {
    try {
      const entries = await loadLegacyQnaRecords(where);
      return entries.map((entry) => mapQna(entry, normalizedOptions.viewer));
    } catch {
      return [];
    }
  }
}

export async function getBoardLandingData(options: { includeReviews?: boolean; viewer?: ViewerContext } = {}) {
  try {
    const [summary, notices, qnaEntries, reviews] = await Promise.all([
      getBoardSummary(),
      listNotices(),
      prisma.qnA.findMany({ select: boardLandingQnaSelect, orderBy: { createdAt: 'desc' }, take: 3 }).catch(() => []),
      options.includeReviews ? listPublicReviews({ limit: 5 }) : Promise.resolve([]),
    ]);

    return {
      summary,
      notices: notices.slice(0, 5),
      qna: (qnaEntries as any[]).map((entry) => mapBoardLandingQna(entry, options.viewer)),
      reviews: reviews.slice(0, 5),
    };
  } catch {
    return {
      summary: { notices: 0, qna: 0, reviews: 0 },
      notices: [],
      qna: [],
      reviews: [],
    };
  }
}

export async function getBoardSummary() {
  if (cachedBoardSummary) return cachedBoardSummary;
  cachedBoardSummary = Promise.all([
    prisma.notice.count().catch(() => 0),
    prisma.qnA.count().catch(() => 0),
    prisma.review.count({ where: { isHidden: false } }).catch(() => 0),
  ]).then(([notices, qna, reviews]) => ({ notices, qna, reviews }));
  return cachedBoardSummary;
}

export async function listPublicReviews(options: { search?: string; limit?: number } = {}) {
  const search = options.search?.trim();
  const limit = options.limit ?? 20;
  try {
    const reviews = await prisma.review.findMany({
      where: { isHidden: false, ...(search ? { content: buildContainsFilter(search) } : {}) },
      include: { shop: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return reviews.map(mapReview);
  } catch {
    return [];
  }
}

export async function getPublicSiteContent() {
  if (cachedPublicSiteContent !== undefined) return cachedPublicSiteContent;
  const content = await getPersistentPublicSiteContent();
  cachedPublicSiteContent = content;
  return content;
}
