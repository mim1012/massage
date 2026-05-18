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
import { clampPage, getTotalPages } from '@/lib/pagination';
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
    const loaded = await loadSiteContentRecord();
    return loaded?.content ?? null;
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

async function loadLegacyQnaRecords(
  where: Prisma.QnAWhereInput,
  pagination?: {
    skip?: number;
    take?: number;
  },
) {
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
    ...(typeof pagination?.skip === 'number' ? { skip: pagination.skip } : {}),
    ...(typeof pagination?.take === 'number' ? { take: pagination.take } : {}),
  });

  return entries.map((entry) => ({ ...entry, comments: [] as [] })) satisfies LegacyQnaRecord[];
}

function canCommentOnQna(entry: { shop?: { ownerId: string | null } | null }, viewer?: ViewerContext) {
  if (!viewer) {
    return false;
  }

  if (viewer.role === 'ADMIN') {
    return true;
  }

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
    userId: review.userId ?? undefined,
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

function hasLegacySiteContent(
  record: DbSiteSettings,
  content: {
    siteSettings: SiteSettings;
    homeSeo: HomeSeoContent;
  },
) {
  return (
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
    record.seoSection3Content !== content.homeSeo.section3Content
  );
}

async function loadSiteContentRecord() {
  const record = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });

  if (!record) {
    return null;
  }

  return {
    record,
    content: mapSiteSettings(record),
  };
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

export async function listManagedShops(
  user: { id: string; role: UserRole },
  filters: { region?: string; q?: string } = {},
) {
  try {
    const where: Prisma.ShopWhereInput = {};

    if (user.role === 'OWNER') {
      where.ownerId = user.id;
    }

    if (filters.region && filters.region !== 'all') {
      where.region = filters.region;
    }

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
  } catch {
    return [];
  }
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
  const shops = await listManagedShops({ id: 'admin', role: 'ADMIN' });

  return {
    premiumShops: shops.filter((shop) => shop.isPremium),
    availableShops: shops.filter((shop) => !shop.isPremium),
  };
}

type NoticeListOptions = {
  search?: string;
};

export async function listNotices(options: NoticeListOptions = {}) {
  const search = options.search?.trim();
  const cacheKey = search ?? '__all__';
  const cached = cachedPublicNoticeLists.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pending = prisma.notice
    .findMany({
      where: search
        ? {
            OR: [{ title: buildContainsFilter(search) }, { content: buildContainsFilter(search) }],
          }
        : undefined,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    })
    .then((notices) => notices.map(mapNotice))
    .catch(() => {
      cachedPublicNoticeLists.delete(cacheKey);
      return [];
    });

  cachedPublicNoticeLists.set(cacheKey, pending);

  return pending;
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

  invalidatePublicBoardCaches();

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

  invalidatePublicBoardCaches();

  return mapNotice(notice);
}

export async function deleteNotice(id: string) {
  const result = await prisma.notice.deleteMany({ where: { id } });
  if (result.count > 0) {
    invalidatePublicBoardCaches();
  }
  return result.count > 0;
}

type QnaListOptions = {
  shopId?: string;
  search?: string;
  viewer?: ViewerContext;
};

type PaginatedListResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type PublicPaginationOptions = {
  page?: number;
  pageSize?: number;
};

const qnaInclude = {
  shop: {
    select: {
      ownerId: true,
      name: true,
      regionLabel: true,
    },
  },
  comments: {
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.QnAInclude;

const boardLandingQnaSelect = {
  id: true,
  shopId: true,
  question: true,
  authorName: true,
  status: true,
  createdAt: true,
  shop: {
    select: {
      ownerId: true,
      name: true,
      regionLabel: true,
    },
  },
  comments: {
    select: {
      content: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  },
  _count: {
    select: {
      comments: true,
    },
  },
} satisfies Prisma.QnASelect;

function buildQnaWhere(shopId?: string, search?: string) {
  return {
    ...(shopId ? { shopId } : {}),
    ...(search
      ? {
          OR: [
            { question: buildContainsFilter(search) },
            { authorName: buildContainsFilter(search) },
            { comments: { some: { content: buildContainsFilter(search) } } },
          ],
        }
      : {}),
  } satisfies Prisma.QnAWhereInput;
}

function buildLegacyQnaWhere(shopId?: string, search?: string) {
  return {
    ...(shopId ? { shopId } : {}),
    ...(search
      ? {
          OR: [
            { question: buildContainsFilter(search) },
            { authorName: buildContainsFilter(search) },
          ],
        }
      : {}),
  } satisfies Prisma.QnAWhereInput;
}

function normalizePagination(options: PublicPaginationOptions) {
  const pageSize = Number.isFinite(options.pageSize) && (options.pageSize ?? 0) > 0 ? Math.floor(options.pageSize ?? 10) : 10;
  const requestedPage = Number.isFinite(options.page) && (options.page ?? 0) > 0 ? Math.floor(options.page ?? 1) : 1;
  return { pageSize, requestedPage };
}

function buildReviewWhere(shopId?: string, search?: string) {
  return {
    isHidden: false,
    ...(shopId ? { shopId } : {}),
    ...(search
      ? {
          OR: [
            { content: buildContainsFilter(search) },
            { authorName: buildContainsFilter(search) },
            { shop: { name: buildContainsFilter(search) } },
          ],
        }
      : {}),
  } satisfies Prisma.ReviewWhereInput;
}

export async function listPublicQnaPage(
  options: QnaListOptions & PublicPaginationOptions = {},
): Promise<PaginatedListResult<QnA>> {
  const shopId = options.shopId?.trim();
  const search = options.search?.trim();
  const { pageSize, requestedPage } = normalizePagination(options);

  try {
    const where = buildQnaWhere(shopId, search);
    const totalItems = await prisma.qnA.count({ where });
    const totalPages = getTotalPages(totalItems, pageSize);
    const page = clampPage(requestedPage, totalPages);
    const items = await prisma.qnA.findMany({
      where,
      include: qnaInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map((entry) => mapQna(entry, options.viewer)),
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  } catch (error) {
    if (!isQnaCommentStorageUnavailable(error)) {
      throw error;
    }

    const where = buildLegacyQnaWhere(shopId, search);
    const totalItems = await prisma.qnA.count({ where });
    const totalPages = getTotalPages(totalItems, pageSize);
    const page = clampPage(requestedPage, totalPages);
    const items = await loadLegacyQnaRecords(where, {
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map((entry) => mapQna(entry, options.viewer)),
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  }
}

export async function listQna(options: string | QnaListOptions = {}) {
  const normalizedOptions = typeof options === 'string' ? { shopId: options } : options;
  const shopId = normalizedOptions.shopId?.trim();
  const search = normalizedOptions.search?.trim();
  const where = buildQnaWhere(shopId, search);

  try {
    const entries = await prisma.qnA.findMany({
      where,
      include: qnaInclude,
      orderBy: { createdAt: 'desc' },
    });

    return entries.map((entry) => mapQna(entry, normalizedOptions.viewer));
  } catch (error) {
    if (!isQnaCommentStorageUnavailable(error)) {
      throw error;
    }

    const legacyWhere = buildLegacyQnaWhere(shopId, search);

    const entries = await loadLegacyQnaRecords(legacyWhere);
    return entries.map((entry) => mapQna(entry, normalizedOptions.viewer));
  }
}

type BoardLandingOptions = {
  includeReviews?: boolean;
  viewer?: ViewerContext;
};

export async function getBoardLandingData(options: BoardLandingOptions = {}) {
  const includeReviews = options.includeReviews ?? false;

  const [summary, notices, qnaEntries, reviews] = await Promise.all([
    getBoardSummary(),
    listNotices(),
    (async () => {
      try {
        const entries = await prisma.qnA.findMany({
          select: boardLandingQnaSelect,
          orderBy: { createdAt: 'desc' },
          take: 3,
        });

        return entries.map((entry) => mapBoardLandingQna(entry, options.viewer));
      } catch (error) {
        if (!isQnaCommentStorageUnavailable(error)) {
          throw error;
        }

        const entries = await prisma.qnA.findMany({
          select: {
            id: true,
            shopId: true,
            question: true,
            authorName: true,
            status: true,
            createdAt: true,
            shop: {
              select: {
                ownerId: true,
                name: true,
                regionLabel: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        });

        return entries.map((entry) => mapBoardLandingQna(entry, options.viewer));
      }
    })(),
    includeReviews ? listReviews(3) : Promise.resolve([]),
  ]);

  return {
    summary,
    notices,
    qnaEntries,
    reviews,
  };
}

export async function createQnaComment(
  id: string,
  input: {
    content: string;
    authorName: string;
    role: QnaCommentRole;
    userId?: string;
  },
  viewer?: ViewerContext,
) {
  const existingEntry = await prisma.qnA.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingEntry) {
    return null;
  }

  try {
    await prisma.$transaction([
      prisma.qnAComment.create({
        data: {
          qnaId: id,
          userId: input.userId ?? null,
          authorName: input.authorName.trim(),
          role: input.role,
          content: input.content.trim(),
        },
      }),
      prisma.qnA.update({
        where: { id },
        data: {
          status: QnaStatus.ANSWERED,
        },
      }),
    ]);

    const entry = await prisma.qnA.findUnique({
      where: { id },
      include: qnaInclude,
    });

    return entry ? mapQna(entry, viewer) : null;
  } catch (error) {
    if (isQnaCommentStorageUnavailable(error)) {
      throw new Error('Q&A 댓글 기능 배포가 아직 완료되지 않았습니다. 데이터베이스 마이그레이션을 먼저 적용해 주세요.');
    }

    throw error;
  }
}

export async function answerQna(
  id: string,
  answer: string,
  answeredBy?: string,
  answeredByName = '운영자',
  role: QnaCommentRole = QnaCommentRole.ADMIN,
  viewer?: ViewerContext,
) {
  return await createQnaComment(
    id,
    {
      content: answer,
      userId: answeredBy,
      authorName: answeredByName,
      role,
    },
    viewer,
  );
}

export async function createQna(
  input: Pick<QnA, 'question' | 'authorName'> & { shopId?: string; userId?: string },
  viewer?: ViewerContext,
) {
  try {
    const entry = await prisma.qnA.create({
      data: {
        question: input.question.trim(),
        authorName: input.authorName.trim(),
        shopId: input.shopId?.trim() || null,
        userId: input.userId?.trim() || null,
        status: QnaStatus.OPEN,
      },
      include: qnaInclude,
    });

    cachedBoardSummary = null;

    return mapQna(entry, viewer);
  } catch (error) {
    if (!isQnaCommentStorageUnavailable(error)) {
      throw error;
    }

    const entry = await prisma.qnA.create({
      data: {
        question: input.question.trim(),
        authorName: input.authorName.trim(),
        shopId: input.shopId?.trim() || null,
        userId: input.userId?.trim() || null,
        status: QnaStatus.OPEN,
      },
      include: {
        shop: {
          select: {
            ownerId: true,
            name: true,
            regionLabel: true,
          },
        },
      },
    });

    cachedBoardSummary = null;

    return mapQna({ ...entry, comments: [] }, viewer);
  }
}

type ReviewListOptions = {
  limit?: number;
  shopId?: string;
  search?: string;
};

const PUBLIC_REVIEWER_EMAIL = 'public-reviewer@massage.local';
const PUBLIC_REVIEWER_PASSWORD_HASH = 'public-reviewer';

async function getPublicReviewerId() {
  const reviewer = await prisma.user.upsert({
    where: { email: PUBLIC_REVIEWER_EMAIL },
    update: {
      name: '공개 리뷰 작성자',
      role: PrismaUserRole.USER,
      status: UserStatus.APPROVED,
      passwordHash: PUBLIC_REVIEWER_PASSWORD_HASH,
    },
    create: {
      email: PUBLIC_REVIEWER_EMAIL,
      name: '공개 리뷰 작성자',
      role: PrismaUserRole.USER,
      status: UserStatus.APPROVED,
      passwordHash: PUBLIC_REVIEWER_PASSWORD_HASH,
    },
    select: { id: true },
  });

  return reviewer.id;
}

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
  userId?: string;
  authorName: string;
  rating: number;
  content: string;
}) {
  const userId = input.userId?.trim() || (await getPublicReviewerId());

  const review = await prisma.review.create({
    data: {
      shopId: input.shopId,
      userId,
      authorName: input.authorName.trim(),
      rating: input.rating,
      content: input.content.trim(),
    },
    include: { shop: { select: { name: true } } },
  });

  await refreshShopReviewRating(input.shopId);
  invalidatePublicShopListCache();
  invalidatePublicBoardCaches();
  return mapReview(review);
}

export async function listPublicReviewPage(
  options: ReviewListOptions & PublicPaginationOptions = {},
): Promise<PaginatedListResult<Review>> {
  const shopId = options.shopId?.trim();
  const search = options.search?.trim();
  const { pageSize, requestedPage } = normalizePagination(options);
  const where = buildReviewWhere(shopId, search);
  const totalItems = await prisma.review.count({ where });
  const totalPages = getTotalPages(totalItems, pageSize);
  const page = clampPage(requestedPage, totalPages);
  const items = await prisma.review.findMany({
    where,
    include: { shop: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items: items.map(mapReview),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

export async function listReviews(options: number | ReviewListOptions = {}) {
  const normalizedOptions =
    typeof options === 'number'
      ? { limit: options }
      : options;
  const shopId = normalizedOptions.shopId?.trim();
  const search = normalizedOptions.search?.trim();
  const limit = typeof normalizedOptions.limit === 'number' ? normalizedOptions.limit : null;
  const cacheKey = JSON.stringify({ shopId: shopId ?? '', search: search ?? '', limit });
  const cached = cachedPublicReviewLists.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pending = prisma.review
    .findMany({
      where: buildReviewWhere(shopId, search),
      include: { shop: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      ...(typeof normalizedOptions.limit === 'number' ? { take: normalizedOptions.limit } : {}),
    })
    .then((reviews) => reviews.map(mapReview))
    .catch(() => {
      cachedPublicReviewLists.delete(cacheKey);
      return [];
    });

  cachedPublicReviewLists.set(cacheKey, pending);

  return pending;
}

export async function listManagedReviews(user: { id: string; role: UserRole }, search?: string) {
  const normalizedSearch = search?.trim();
  const reviewWhere =
    user.role === 'ADMIN'
      ? {
          ...(normalizedSearch
            ? {
                OR: [
                  { content: buildContainsFilter(normalizedSearch) },
                  { authorName: buildContainsFilter(normalizedSearch) },
                  { shop: { name: buildContainsFilter(normalizedSearch) } },
                ],
              }
            : {}),
        }
      : {
          shop: {
            ownerId: user.id,
          },
          ...(normalizedSearch
            ? {
                OR: [
                  { content: buildContainsFilter(normalizedSearch) },
                  { authorName: buildContainsFilter(normalizedSearch) },
                  { shop: { name: buildContainsFilter(normalizedSearch) } },
                ],
              }
            : {}),
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
  try {
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

    await refreshShopReviewRating(review.shopId);
    invalidatePublicShopListCache();
    invalidatePublicBoardCaches();

    return mapReview(updated);
  } catch {
    return null;
  }
}

export async function deleteManagedReview(user: { id: string; role: UserRole }, reviewId: string) {
  try {
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
    invalidatePublicShopListCache();
    invalidatePublicBoardCaches();
    return true;
  } catch {
    return false;
  }
}

export async function deleteManagedQna(user: { id: string; role: UserRole }, qnaId: string) {
  const qna = await prisma.qnA.findUnique({
    where: { id: qnaId },
    select: {
      shop: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!qna) {
    return false;
  }

  if (user.role !== 'ADMIN' && qna.shop?.ownerId !== user.id) {
    return false;
  }

  try {
    await prisma.qnA.delete({ where: { id: qnaId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return false;
    }

    throw error;
  }

  invalidatePublicBoardCaches();
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

  invalidatePublicShopListCache();

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

    invalidatePublicShopListCache();

    return mapShop(shop);
  } catch {
    return null;
  }
}

export async function getBoardSummary() {
  if (cachedBoardSummary) {
    return cachedBoardSummary;
  }

  const pending = Promise.all([
    prisma.notice.count(),
    prisma.qnA.count(),
    prisma.review.count({ where: { isHidden: false } }),
  ])
    .then(([notices, qna, reviews]) => ({
      notices,
      qna,
      reviews,
    }))
    .catch(() => {
      cachedBoardSummary = null;
      return {
        notices: 0,
        qna: 0,
        reviews: 0,
      };
    });

  cachedBoardSummary = pending;
  return pending;
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
  const loaded = await loadSiteContentRecord();

  if (!loaded) {
    return null;
  }

  const { record, content } = loaded;

  if (hasLegacySiteContent(record, content)) {
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

  cachedPublicSiteContent = content;

  return content;
}

export async function getPublicSiteContent() {
  if (cachedPublicSiteContent !== undefined) {
    return cachedPublicSiteContent;
  }

  cachedPublicSiteContent = await getPersistentPublicSiteContent();

  return cachedPublicSiteContent;
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

  const content = mapSiteSettings(record);
  cachedPublicSiteContent = content;
  revalidateTag(PUBLIC_SITE_CONTENT_CACHE_TAG, 'max');

  return content;
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

export async function updateReview(
  id: string,
  input: { rating?: number; content?: string; authorName?: string },
) {
  try {
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(typeof input.rating === 'number' ? { rating: input.rating } : {}),
        ...(input.content !== undefined ? { content: input.content.trim() } : {}),
        ...(input.authorName !== undefined ? { authorName: input.authorName.trim() } : {}),
      },
      include: { shop: { select: { name: true } } },
    });
    await refreshShopReviewRating(review.shopId);
    invalidatePublicShopListCache();
    invalidatePublicBoardCaches();
    return mapReview(review);
  } catch {
    return null;
  }
}

export async function deleteReview(id: string) {
  try {
    const review = await prisma.review.delete({
      where: { id },
    });
    await refreshShopReviewRating(review.shopId);
    invalidatePublicShopListCache();
    invalidatePublicBoardCaches();
    return true;
  } catch {
    return false;
  }
}
