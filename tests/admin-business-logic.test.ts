import assert from 'node:assert/strict';
import test from 'node:test';
import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { createSession, getUserBySessionToken, listOwnerApprovals, listUsers, registerOwner, updateOwnerStatus } from '@/lib/server/auth-store';
import { answerQna, createAdminShop, createQnaComment, deleteManagedReview, listManagedShops, listNotices, setReviewHiddenState, updateAdminShop, updateReview } from '@/lib/server/communityStore';
import type { Shop } from '@/lib/types';
import { deleteTheme } from '@/lib/server/theme-store';

async function cleanup(ids: { userIds?: string[]; shopIds?: string[]; themeCodes?: string[] }) {
  if (ids.shopIds?.length) {
    await prisma.review.deleteMany({ where: { shopId: { in: ids.shopIds } } });
    await prisma.shop.deleteMany({ where: { id: { in: ids.shopIds } } });
  }
  if (ids.userIds?.length) {
    await prisma.ownerProfile.deleteMany({ where: { userId: { in: ids.userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: ids.userIds } } });
  }
  if (ids.themeCodes?.length) {
    await prisma.theme.deleteMany({ where: { code: { in: ids.themeCodes } } });
  }
}

test('owner approval status can transition only once from pending', async () => {
  const ownerId = 'test-owner-transition';
  await cleanup({ userIds: [ownerId] });

  try {
    await prisma.user.create({
      data: {
        id: ownerId,
        email: `${ownerId}@example.com`,
        passwordHash: 'hash',
        name: '테스트 업주',
        role: UserRole.OWNER,
        status: UserStatus.PENDING,
        ownerProfile: {
          create: {
            businessName: '전환 테스트샵',
            businessNumber: '111-22-33333',
          },
        },
      },
    });

    const approved = await updateOwnerStatus(ownerId, 'approved');
    assert.equal(approved?.status, 'approved');

    const staleReject = await updateOwnerStatus(ownerId, 'rejected');
    assert.equal(staleReject, null);

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });
    assert.equal(stored.status, UserStatus.APPROVED);
  } finally {
    await cleanup({ userIds: [ownerId] });
  }
});

test('pending owner sessions are rejected during session hydration', async () => {
  const ownerId = 'test-owner-session-pending';
  await cleanup({ userIds: [ownerId] });

  try {
    await prisma.user.create({
      data: {
        id: ownerId,
        email: `${ownerId}@example.com`,
        passwordHash: 'hash',
        name: '대기 업주',
        role: UserRole.OWNER,
        status: UserStatus.PENDING,
        ownerProfile: {
          create: {
            businessName: '세션 테스트샵',
            businessNumber: '111-22-33333',
          },
        },
      },
    });

    const token = createSession(ownerId, 0);
    assert.equal(await getUserBySessionToken(token), null);
  } finally {
    await cleanup({ userIds: [ownerId] });
  }
});
test('approval and rejection rotate owner sessions', async () => {
  const ownerId = 'test-owner-session-rotation';
  await cleanup({ userIds: [ownerId] });

  try {
    await prisma.user.create({
      data: {
        id: ownerId,
        email: `${ownerId}@example.com`,
        passwordHash: 'hash',
        name: '세션 회전 업주',
        role: UserRole.OWNER,
        status: UserStatus.PENDING,
        ownerProfile: {
          create: {
            businessName: '세션 회전샵',
            businessNumber: '111-22-33333',
          },
        },
      },
    });

    const staleToken = createSession(ownerId, 0);
    assert.equal(await updateOwnerStatus(ownerId, 'approved').then((user) => user?.status), 'approved');
    assert.equal(await getUserBySessionToken(staleToken), null);

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });
    const freshToken = createSession(ownerId, stored.sessionVersion);
    assert.equal((await getUserBySessionToken(freshToken))?.id, ownerId);
  } finally {
    await cleanup({ userIds: [ownerId] });
  }
});

test('rejected owners can submit a fresh pending application with the same email', async () => {
  const ownerId = 'test-owner-reapply';
  await cleanup({ userIds: [ownerId] });

  try {
    await prisma.user.create({
      data: {
        id: ownerId,
        email: `${ownerId}@example.com`,
        passwordHash: 'old-hash',
        name: '반려 업주',
        role: UserRole.OWNER,
        status: UserStatus.REJECTED,
        phone: '010-0000-0000',
        ownerProfile: {
          create: {
            businessName: '반려 전 샵',
            businessNumber: '111-22-33333',
            approvedAt: new Date(),
          },
        },
      },
    });

    const reopened = await registerOwner({
      name: '재신청 업주',
      email: `${ownerId}@example.com`,
      password: 'new-password',
      businessName: '재신청 샵',
      businessNumber: '999-88-77777',
      phone: '010-9999-9999',
    });

    assert.equal(reopened.id, ownerId);
    assert.equal(reopened.status, 'pending');
    assert.equal(reopened.businessName, '재신청 샵');
    assert.equal(reopened.businessNumber, '999-88-77777');
    assert.equal(reopened.phone, '010-9999-9999');

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      include: { ownerProfile: true },
    });
    assert.equal(stored.status, UserStatus.PENDING);
    assert.equal(stored.ownerProfile?.approvedAt, null);
    assert.equal(stored.sessionVersion, 1);
  } finally {
    await cleanup({ userIds: [ownerId] });
  }
});

test('only rejected owners can reapply with an existing owner email', async () => {
  const pendingId = 'test-owner-reapply-pending';
  const approvedId = 'test-owner-reapply-approved';
  await cleanup({ userIds: [pendingId, approvedId] });

  try {
    await prisma.user.createMany({
      data: [
        {
          id: pendingId,
          email: `${pendingId}@example.com`,
          passwordHash: 'hash',
          name: '대기 업주',
          role: UserRole.OWNER,
          status: UserStatus.PENDING,
          phone: '010-1111-1111',
        },
        {
          id: approvedId,
          email: `${approvedId}@example.com`,
          passwordHash: 'hash',
          name: '승인 업주',
          role: UserRole.OWNER,
          status: UserStatus.APPROVED,
          phone: '010-2222-2222',
        },
      ],
    });

    await assert.rejects(
      () =>
        registerOwner({
          name: '대기 재신청',
          email: `${pendingId}@example.com`,
          password: 'password',
          businessName: '대기 샵',
          businessNumber: '111-11-11111',
          phone: '010-3333-3333',
        }),
      /EMAIL_IN_USE/,
    );

    await assert.rejects(
      () =>
        registerOwner({
          name: '승인 재신청',
          email: `${approvedId}@example.com`,
          password: 'password',
          businessName: '승인 샵',
          businessNumber: '222-22-22222',
          phone: '010-4444-4444',
        }),
      /EMAIL_IN_USE/,
    );
  } finally {
    await cleanup({ userIds: [pendingId, approvedId] });
  }
});

function buildShopInput(overrides: Partial<Shop> = {}): Shop {
  const now = new Date(0).toISOString();
  return {
    id: 'input-shop',
    name: '입력 테스트샵',
    slug: 'input-test-shop',
    region: 'seoul',
    regionLabel: '서울',
    theme: 'swedish',
    themeLabel: '스웨디시',
    isPremium: false,
    premiumOrder: undefined,
    thumbnailUrl: '',
    bannerUrl: '',
    images: [],
    tagline: '테스트',
    description: '테스트 설명',
    address: '서울',
    phone: '010-0000-0000',
    hours: '24시간',
    rating: 5,
    reviewCount: 0,
    courses: [],
    tags: [],
    isVisible: false,
    ownerId: undefined,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
test('shop creation auto-generates a unique slug from the shop name', async () => {
  const createdShopIds: string[] = [];

  await prisma.shop.deleteMany({ where: { slug: { in: ['auto-slug-shop', 'auto-slug-shop-2'] } } });

  try {
    const first = await createAdminShop(buildShopInput({ name: 'Auto Slug Shop', slug: 'user-supplied-slug' }));
    createdShopIds.push(first.id);
    assert.equal(first.slug, 'auto-slug-shop');

    const second = await createAdminShop(buildShopInput({ name: 'Auto Slug Shop', slug: 'another-user-supplied-slug' }));
    createdShopIds.push(second.id);
    assert.equal(second.slug, 'auto-slug-shop-2');
  } finally {
    await cleanup({ shopIds: createdShopIds });
  }
});

test('shop create and update ignore client-supplied aggregate ratings', async () => {
  let createdShopId = '';
  await prisma.shop.deleteMany({ where: { slug: 'owner-rating-tamper-shop' } });

  try {
    const created = await createAdminShop(buildShopInput({ slug: 'owner-rating-tamper-shop', rating: 5 }));
    createdShopId = created.id;
    assert.equal(created.rating, 0);

    await prisma.shop.update({ where: { id: createdShopId }, data: { rating: 2 } });
    const updated = await updateAdminShop(createdShopId, buildShopInput({ id: createdShopId, slug: 'owner-rating-tamper-shop', rating: 5 }));
    assert.equal(updated?.rating, 2);
  } finally {
    await cleanup({ shopIds: [createdShopId].filter(Boolean) });
  }
});

test('owner-scoped shop update preserves admin-only fields and rejects stale owners', async () => {
  const ownerId = 'test-owner-shop-update-owner';
  const otherOwnerId = 'test-owner-shop-update-other';
  let createdShopId = '';
  await cleanup({ userIds: [ownerId, otherOwnerId] });
  await prisma.shop.deleteMany({ where: { slug: 'owner-scoped-update-shop' } });

  try {
    await prisma.user.createMany({
      data: [
        {
          id: ownerId,
          email: `${ownerId}@example.com`,
          passwordHash: 'hash',
          name: '업주',
          role: UserRole.OWNER,
          status: UserStatus.APPROVED,
        },
        {
          id: otherOwnerId,
          email: `${otherOwnerId}@example.com`,
          passwordHash: 'hash',
          name: '다른 업주',
          role: UserRole.OWNER,
          status: UserStatus.APPROVED,
        },
      ],
    });

    const created = await createAdminShop(buildShopInput({
      slug: 'owner-scoped-update-shop',
      ownerId,
      isVisible: false,
      isPremium: false,
      premiumOrder: undefined,
    }));
    createdShopId = created.id;

    const updated = await updateAdminShop(
      createdShopId,
      buildShopInput({
        id: createdShopId,
        slug: 'owner-scoped-update-shop',
        name: '업주 수정 이름',
        ownerId: otherOwnerId,
        isVisible: true,
        isPremium: true,
        premiumOrder: 1,
      }),
      { ownerId },
    );

    assert.equal(updated?.name, '업주 수정 이름');

    const stored = await prisma.shop.findUniqueOrThrow({ where: { id: createdShopId } });
    assert.equal(stored.ownerId, ownerId);
    assert.equal(stored.isVisible, false);
    assert.equal(stored.isPremium, false);
    assert.equal(stored.premiumOrder, null);

    await prisma.shop.update({ where: { id: createdShopId }, data: { ownerId: otherOwnerId } });
    const staleUpdate = await updateAdminShop(
      createdShopId,
      buildShopInput({ id: createdShopId, slug: 'owner-scoped-update-shop', name: 'stale write' }),
      { ownerId },
    );
    assert.equal(staleUpdate, null);

    const afterStale = await prisma.shop.findUniqueOrThrow({ where: { id: createdShopId } });
    assert.equal(afterStale.name, '업주 수정 이름');
    assert.equal(afterStale.ownerId, otherOwnerId);
  } finally {
    await cleanup({ shopIds: [createdShopId].filter(Boolean), userIds: [ownerId, otherOwnerId] });
  }
});

test('hiding a review recalculates shop rating from visible reviews only', async () => {
  const userId = 'test-review-user';
  const shopId = 'test-review-shop';
  const reviewToHideId = 'test-review-hide';
  const visibleReviewId = 'test-review-visible';
  await cleanup({ shopIds: [shopId], userIds: [userId] });

  try {
    await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        passwordHash: 'hash',
        name: '리뷰 유저',
        role: UserRole.USER,
        status: UserStatus.APPROVED,
      },
    });
    await prisma.shop.create({
      data: {
        id: shopId,
        name: '평점 테스트샵',
        slug: 'rating-test-shop',
        region: 'seoul',
        regionLabel: '서울',
        theme: 'swedish',
        themeLabel: '스웨디시',
        tagline: '테스트',
        description: '테스트 설명',
        address: '서울',
        phone: '010-0000-0000',
        hours: '24시간',
        rating: 4,
        tags: [],
      },
    });
    await prisma.review.createMany({
      data: [
        { id: reviewToHideId, shopId, userId, authorName: 'A', rating: 5, content: '숨김 대상' },
        { id: visibleReviewId, shopId, userId, authorName: 'B', rating: 1, content: '노출 대상' },
      ],
    });

    const updated = await setReviewHiddenState({ id: 'admin', role: UserRole.ADMIN }, reviewToHideId, true);
    assert.equal(updated?.isHidden, true);

    const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } });
    assert.equal(shop.rating, 1);
  } finally {
    await cleanup({ shopIds: [shopId], userIds: [userId] });
  }
});

test('answerQna does not create duplicate answer comments for an already answered entry', async () => {
  const userId = 'test-qna-answer-user';
  const shopId = 'test-qna-answer-shop';
  const qnaId = 'test-qna-answer';
  await cleanup({ shopIds: [shopId], userIds: [userId] });

  try {
    await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        passwordHash: 'hash',
        name: 'QNA 유저',
        role: UserRole.OWNER,
        status: UserStatus.APPROVED,
        ownerProfile: {
          create: {
            businessName: 'QNA 테스트샵',
            businessNumber: '111-22-33333',
          },
        },
      },
    });
    await prisma.shop.create({
      data: {
        id: shopId,
        ownerId: userId,
        name: 'QNA 테스트샵',
        slug: 'qna-answer-test-shop',
        region: 'seoul',
        regionLabel: '서울',
        theme: 'swedish',
        themeLabel: '스웨디시',
        tagline: '테스트',
        description: '테스트 설명',
        address: '서울',
        phone: '010-0000-0000',
        hours: '24시간',
        tags: [],
      },
    });
    await prisma.qnA.create({
      data: {
        id: qnaId,
        shopId,
        userId,
        authorName: '문의자',
        question: '문의입니다.',
      },
    });

    const [first, second] = await Promise.all([
      answerQna(qnaId, '첫 답변', userId, '점주', 'OWNER', { id: userId, role: UserRole.OWNER }),
      answerQna(qnaId, '중복 답변', userId, '점주', 'OWNER', { id: userId, role: UserRole.OWNER }),
    ]);

    assert.equal(first?.isAnswered, true);
    assert.equal(second?.isAnswered, true);
    assert.equal(await prisma.qnAComment.count({ where: { qnaId } }), 1);
  } finally {
    await cleanup({ shopIds: [shopId], userIds: [userId] });
  }
});
test('owner qna answer and comments recheck ownership in the write transaction', async () => {
  const ownerId = 'test-qna-owner-authorized';
  const otherOwnerId = 'test-qna-owner-stale';
  const shopId = 'test-qna-owner-auth-shop';
  const qnaId = 'test-qna-owner-auth';
  await cleanup({ shopIds: [shopId], userIds: [ownerId, otherOwnerId] });

  try {
    await prisma.user.createMany({
      data: [
        {
          id: ownerId,
          email: `${ownerId}@example.com`,
          passwordHash: 'hash',
          name: '원래 업주',
          role: UserRole.OWNER,
          status: UserStatus.APPROVED,
        },
        {
          id: otherOwnerId,
          email: `${otherOwnerId}@example.com`,
          passwordHash: 'hash',
          name: '다른 업주',
          role: UserRole.OWNER,
          status: UserStatus.APPROVED,
        },
      ],
    });
    await prisma.shop.create({
      data: {
        id: shopId,
        ownerId: otherOwnerId,
        name: 'QNA 소유권 테스트샵',
        slug: 'qna-owner-auth-shop',
        region: 'seoul',
        regionLabel: '서울',
        theme: 'swedish',
        themeLabel: '스웨디시',
        tagline: '테스트',
        description: '테스트 설명',
        address: '서울',
        phone: '010-0000-0000',
        hours: '24시간',
        tags: [],
      },
    });
    await prisma.qnA.create({
      data: {
        id: qnaId,
        shopId,
        userId: ownerId,
        authorName: '문의자',
        question: '문의입니다.',
      },
    });

    const staleAnswer = await answerQna(qnaId, '권한 없는 답변', ownerId, '원래 업주', 'OWNER', {
      id: ownerId,
      role: UserRole.OWNER,
    });
    const staleComment = await createQnaComment(
      qnaId,
      {
        content: '권한 없는 댓글',
        userId: ownerId,
        authorName: '원래 업주',
        role: 'OWNER',
      },
      { id: ownerId, role: UserRole.OWNER },
    );

    assert.equal(staleAnswer, null);
    assert.equal(staleComment, null);
    assert.equal(await prisma.qnAComment.count({ where: { qnaId } }), 0);
    assert.equal((await prisma.qnA.findUniqueOrThrow({ where: { id: qnaId } })).status, 'OPEN');
  } finally {
    await cleanup({ shopIds: [shopId], userIds: [ownerId, otherOwnerId] });
  }
});

test('theme deletion is blocked while shops still reference the theme', async () => {
  const themeCode = 'test-theme-in-use';
  const shopId = 'test-theme-shop';
  await cleanup({ shopIds: [shopId], themeCodes: [themeCode] });

  try {
    await prisma.theme.create({ data: { code: themeCode, label: '테스트 테마', emoji: '', sortOrder: 999 } });
    await prisma.shop.create({
      data: {
        id: shopId,
        name: '테마 테스트샵',
        slug: 'theme-test-shop',
        region: 'seoul',
        regionLabel: '서울',
        theme: themeCode,
        themeLabel: '테스트 테마',
        tagline: '테스트',
        description: '테스트 설명',
        address: '서울',
        phone: '010-0000-0000',
        hours: '24시간',
        tags: [],
      },
    });

    const result = await deleteTheme(themeCode);
    assert.deepEqual(result, { ok: false, status: 409, error: '사용 중인 테마는 삭제할 수 없습니다.' });
    assert.ok(await prisma.theme.findUnique({ where: { code: themeCode } }));
  } finally {
    await cleanup({ shopIds: [shopId], themeCodes: [themeCode] });
  }
});

test('managed review mutations recalculate rating in the same write path', async () => {
  const userId = 'test-review-mutation-user';
  const shopId = 'test-review-mutation-shop';
  const deletedReviewId = 'test-review-mutation-delete';
  const remainingReviewId = 'test-review-mutation-remaining';
  await cleanup({ shopIds: [shopId], userIds: [userId] });

  try {
    await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        passwordHash: 'hash',
        name: '리뷰 뮤테이션 유저',
        role: UserRole.USER,
        status: UserStatus.APPROVED,
      },
    });
    await prisma.shop.create({
      data: {
        id: shopId,
        name: '리뷰 뮤테이션샵',
        slug: 'review-mutation-shop',
        region: 'seoul',
        regionLabel: '서울',
        theme: 'swedish',
        themeLabel: '스웨디시',
        tagline: '테스트',
        description: '테스트 설명',
        address: '서울',
        phone: '010-0000-0000',
        hours: '24시간',
        rating: 3,
        tags: [],
      },
    });
    await prisma.review.createMany({
      data: [
        { id: deletedReviewId, shopId, userId, authorName: 'A', rating: 5, content: '삭제 대상' },
        { id: remainingReviewId, shopId, userId, authorName: 'B', rating: 1, content: '남는 리뷰' },
      ],
    });

    const updated = await updateReview(remainingReviewId, { rating: 2 });
    assert.equal(updated?.rating, 2);
    assert.equal((await prisma.shop.findUniqueOrThrow({ where: { id: shopId } })).rating, 3.5);

    assert.equal(await deleteManagedReview({ id: 'admin', role: UserRole.ADMIN }, deletedReviewId), true);
    assert.equal((await prisma.shop.findUniqueOrThrow({ where: { id: shopId } })).rating, 2);
  } finally {
    await cleanup({ shopIds: [shopId], userIds: [userId] });
  }
});

test('managed review mutation infrastructure surfaces unexpected transaction failures', async () => {
  const originalTransaction = prisma.$transaction.bind(prisma);
  prisma.$transaction = (async () => {
    throw new Error('simulated transaction outage');
  }) as typeof prisma.$transaction;

  try {
    await assert.rejects(() => updateReview('missing-review', { rating: 3 }), /simulated transaction outage/);
    await assert.rejects(
      () => deleteManagedReview({ id: 'admin', role: UserRole.ADMIN }, 'missing-review'),
      /simulated transaction outage/,
    );
  } finally {
    prisma.$transaction = originalTransaction;
  }
});
test('admin list helpers surface database failures instead of empty success states', async () => {
  const originalUserFindMany = prisma.user.findMany.bind(prisma.user);
  const originalShopFindMany = prisma.shop.findMany.bind(prisma.shop);
  const originalNoticeFindMany = prisma.notice.findMany.bind(prisma.notice);

  prisma.user.findMany = (async () => {
    throw new Error('simulated users outage');
  }) as typeof prisma.user.findMany;
  prisma.shop.findMany = (async () => {
    throw new Error('simulated shops outage');
  }) as typeof prisma.shop.findMany;
  prisma.notice.findMany = (async () => {
    throw new Error('simulated notices outage');
  }) as typeof prisma.notice.findMany;

  try {
    await assert.rejects(() => listOwnerApprovals(), /DATABASE_ERROR/);
    await assert.rejects(() => listUsers(), /DATABASE_ERROR/);
    await assert.rejects(() => listManagedShops({ id: 'admin', role: UserRole.ADMIN }), /DATABASE_ERROR/);
    await assert.rejects(() => listNotices({ strict: true }), /DATABASE_ERROR/);
  } finally {
    prisma.user.findMany = originalUserFindMany;
    prisma.shop.findMany = originalShopFindMany;
    prisma.notice.findMany = originalNoticeFindMany;
  }
});

test('DATABASE_ERROR maps to service-unavailable admin responses', async () => {
  const { errorResponse } = await import('@/lib/auth/http');

  const response = errorResponse(new Error('DATABASE_ERROR'));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: '데이터베이스 연결에 실패했습니다. 관리자에게 문의해 주세요.',
  });
});
