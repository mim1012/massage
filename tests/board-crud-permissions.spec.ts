import { expect, request, test, type APIRequestContext } from '@playwright/test';
import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const RUN_ID = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

type Actor = 'anonymous' | 'user' | 'owner' | 'otherOwner' | 'admin';

const credentials: Record<Exclude<Actor, 'anonymous'>, { email: string; password: string }> = {
  user: { email: 'user@massage.local', password: 'user1234' },
  owner: { email: 'owner@massage.local', password: 'owner1234' },
  otherOwner: { email: `board-perm-owner-${RUN_ID}@massage.local`, password: 'other-owner1234' },
  admin: { email: 'admin@massage.local', password: 'admin1234' },
};

let contexts: Record<Actor, APIRequestContext>;
let seed: {
  userId: string;
  ownerId: string;
  otherOwnerId: string;
  ownerShopId: string;
  otherShopId: string;
};
const cleanupIds = {
  reviews: new Set<string>(),
  qna: new Set<string>(),
  notices: new Set<string>(),
  partnerships: new Set<string>(),
  shops: new Set<string>(),
  users: new Set<string>(),
};

async function newApiContext() {
  return request.newContext({ baseURL: BASE_URL });
}

async function login(actor: Exclude<Actor, 'anonymous'>) {
  const context = await newApiContext();
  const response = await context.post('/api/auth/login', { data: credentials[actor] });
  expect(response.status(), `${actor} login should succeed`).toBe(200);
  return context;
}

async function json<T>(response: { json(): Promise<T> }) {
  return response.json();
}

async function expectStatus(
  actor: Actor,
  method: 'get' | 'post' | 'patch' | 'delete',
  url: string,
  expected: number,
  data?: unknown,
) {
  const response = await contexts[actor][method](url, data === undefined ? undefined : { data });
  expect(response.status(), `${actor} ${method.toUpperCase()} ${url}`).toBe(expected);
  return response;
}

async function createReviewAs(actor: Actor, shopId = seed.ownerShopId) {
  const response = await expectStatus(actor, 'post', '/api/board/reviews', 201, {
    shopId,
    rating: 5,
    content: `권한 테스트 리뷰 ${actor} ${RUN_ID}`,
  });
  const payload = await json<{ review: { id: string } }>(response);
  cleanupIds.reviews.add(payload.review.id);
  return payload.review.id;
}

async function createQnaAs(actor: Actor, shopId: string | null = seed.ownerShopId) {
  const response = await expectStatus(actor, 'post', '/api/board/qna', 201, {
    shopId,
    question: `권한 테스트 질문 ${actor} ${RUN_ID}`,
  });
  const payload = await json<{ qna: { id: string } }>(response);
  cleanupIds.qna.add(payload.qna.id);
  return payload.qna.id;
}

async function createNoticeAsAdmin() {
  const response = await expectStatus('admin', 'post', '/api/admin/notices', 201, {
    title: `권한 테스트 공지 ${RUN_ID}`,
    content: '공지 CRUD 권한 테스트',
    isPinned: false,
  });
  const payload = await json<{ notice: { id: string } }>(response);
  cleanupIds.notices.add(payload.notice.id);
  return payload.notice.id;
}

async function createPartnershipAsAnonymous() {
  const response = await expectStatus('anonymous', 'post', '/api/board/partnership', 201, {
    shopName: `권한 테스트 제휴 ${RUN_ID}`,
    region: 'seoul',
    subRegion: 'gangnam',
    theme: 'swedish',
    contactName: '테스터',
    phone: '010-9999-0000',
    kakaoId: 'perm-test',
    message: '제휴 문의 권한 테스트',
  });
  const payload = await json<{ inquiry: { id: string } }>(response);
  cleanupIds.partnerships.add(payload.inquiry.id);
  return payload.inquiry.id;
}

test.describe('게시판 CRUD 권한 매트릭스', () => {
  test.describe.configure({ timeout: 180_000 });
  test.setTimeout(120_000);

  test.beforeAll(async () => {
    const [user, owner, ownerShop] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: credentials.user.email } }),
      prisma.user.findUniqueOrThrow({ where: { email: credentials.owner.email } }),
      prisma.shop.findUniqueOrThrow({ where: { slug: 'healing-spa-seoul' } }),
    ]);

    const otherOwner = await prisma.user.upsert({
      where: { email: credentials.otherOwner.email },
      update: {
        passwordHash: hashPassword(credentials.otherOwner.password),
        name: '타 업소 점주',
        role: UserRole.OWNER,
        status: UserStatus.APPROVED,
      },
      create: {
        email: credentials.otherOwner.email,
        passwordHash: hashPassword(credentials.otherOwner.password),
        name: '타 업소 점주',
        role: UserRole.OWNER,
        status: UserStatus.APPROVED,
      },
    });
    cleanupIds.users.add(otherOwner.id);

    const otherShop = await prisma.shop.create({
      data: {
        ownerId: otherOwner.id,
        name: `타 업소 권한 테스트 ${RUN_ID}`,
        slug: `board-perm-other-shop-${RUN_ID}`,
        region: 'seoul',
        regionLabel: '서울',
        subRegion: 'gangnam',
        subRegionLabel: '강남',
        theme: 'swedish',
        themeLabel: '스웨디시',
        tagline: '권한 테스트 업소',
        description: '권한 테스트 업소 설명',
        address: '서울 테스트로 1',
        phone: '010-1111-0000',
        hours: '10:00 - 22:00',
        isVisible: true,
        isPremium: false,
        thumbnailUrl: '/images/test-thumb.jpg',
        bannerUrl: '/images/test-banner.jpg',
        rating: 0,
        tags: ['테스트'],
      },
    });
    cleanupIds.shops.add(otherShop.id);

    seed = {
      userId: user.id,
      ownerId: owner.id,
      otherOwnerId: otherOwner.id,
      ownerShopId: ownerShop.id,
      otherShopId: otherShop.id,
    };

    contexts = {
      anonymous: await newApiContext(),
      user: await login('user'),
      owner: await login('owner'),
      otherOwner: await login('otherOwner'),
      admin: await login('admin'),
    };
  }, 180_000);

  test.afterAll(async () => {
    await Promise.all(Object.values(contexts ?? {}).map((context) => context.dispose()));
    await prisma.qnAComment.deleteMany({ where: { qnaId: { in: [...cleanupIds.qna] } } });
    await prisma.qnA.deleteMany({ where: { id: { in: [...cleanupIds.qna] } } });
    await prisma.review.deleteMany({ where: { id: { in: [...cleanupIds.reviews] } } });
    await prisma.notice.deleteMany({ where: { id: { in: [...cleanupIds.notices] } } });
    await prisma.partnershipInquiry.deleteMany({ where: { id: { in: [...cleanupIds.partnerships] } } });
    await prisma.shop.deleteMany({ where: { id: { in: [...cleanupIds.shops] } } });
    await prisma.user.deleteMany({ where: { id: { in: [...cleanupIds.users] } } });
  });

  test('공지: public read는 허용하고 create/update/delete는 ADMIN만 허용한다', async () => {
    await expectStatus('anonymous', 'get', '/api/board/notices', 200);
    await expectStatus('user', 'get', '/api/board/notices', 200);
    await expectStatus('owner', 'get', '/api/board/notices', 200);
    await expectStatus('admin', 'get', '/api/admin/notices', 200);

    for (const actor of ['anonymous', 'user', 'owner'] as const) {
      await expectStatus(actor, 'post', '/api/admin/notices', actor === 'anonymous' ? 401 : 403, {
        title: '차단되어야 하는 공지',
        content: '권한 없음',
      });
    }

    const noticeId = await createNoticeAsAdmin();
    await expectStatus('anonymous', 'get', `/api/board/notices/${noticeId}`, 200);

    for (const actor of ['anonymous', 'user', 'owner'] as const) {
      await expectStatus(actor, 'patch', `/api/admin/notices/${noticeId}`, actor === 'anonymous' ? 401 : 403, {
        title: '차단되어야 하는 수정',
        content: '권한 없음',
      });
      await expectStatus(actor, 'delete', `/api/admin/notices/${noticeId}`, actor === 'anonymous' ? 401 : 403);
    }

    await expectStatus('admin', 'patch', `/api/admin/notices/${noticeId}`, 200, {
      title: `수정된 공지 ${RUN_ID}`,
      content: '관리자 수정 성공',
      isPinned: true,
    });
    await expectStatus('admin', 'delete', `/api/admin/notices/${noticeId}`, 204);
    cleanupIds.notices.delete(noticeId);
  });

  test('리뷰: USER 본인/ADMIN은 public 수정삭제 가능하고 타 USER/OWNER는 차단된다', async () => {
    await expectStatus('anonymous', 'get', '/api/board/reviews', 200);
    await expectStatus('anonymous', 'post', '/api/board/reviews', 401, {
      shopId: seed.ownerShopId,
      rating: 5,
      content: '미로그인 리뷰',
    });

    const userReviewId = await createReviewAs('user');
    await expectStatus('user', 'patch', `/api/board/reviews/${userReviewId}`, 200, {
      rating: 4,
      content: `본인 수정 성공 ${RUN_ID}`,
    });
    await expectStatus('owner', 'patch', `/api/board/reviews/${userReviewId}`, 403, {
      rating: 3,
      content: '소유 업소 점주라도 public route에서 타인 리뷰 수정 불가',
    });
    await expectStatus('otherOwner', 'delete', `/api/board/reviews/${userReviewId}`, 403);
    await expectStatus('admin', 'patch', `/api/board/reviews/${userReviewId}`, 200, {
      rating: 5,
      content: `관리자 public 수정 성공 ${RUN_ID}`,
    });
    await expectStatus('user', 'delete', `/api/board/reviews/${userReviewId}`, 200);
    cleanupIds.reviews.delete(userReviewId);
  });

  test('관리 리뷰: OWNER는 자기 업소만 create/update/delete 가능하고 USER/타 OWNER는 차단된다', async () => {
    await expectStatus('anonymous', 'get', '/api/admin/reviews', 401);
    await expectStatus('user', 'get', '/api/admin/reviews', 403);
    await expectStatus('owner', 'get', '/api/admin/reviews', 200);
    await expectStatus('admin', 'get', '/api/admin/reviews', 200);

    await expectStatus('user', 'post', '/api/admin/reviews', 403, {
      shopId: seed.ownerShopId,
      authorName: '권한 없음',
      rating: 5,
      content: 'USER는 관리 리뷰 생성 불가',
    });
    await expectStatus('otherOwner', 'post', '/api/admin/reviews', 403, {
      shopId: seed.ownerShopId,
      authorName: '타 점주',
      rating: 5,
      content: '타 업소 리뷰 생성 불가',
    });

    const ownerManagedReviewResponse = await expectStatus('owner', 'post', '/api/admin/reviews', 201, {
      shopId: seed.ownerShopId,
      authorName: '점주 생성 리뷰',
      rating: 5,
      content: `점주 관리 리뷰 ${RUN_ID}`,
    });
    const ownerManagedReview = await json<{ review: { id: string } }>(ownerManagedReviewResponse);
    cleanupIds.reviews.add(ownerManagedReview.review.id);

    await expectStatus('otherOwner', 'patch', `/api/admin/reviews/${ownerManagedReview.review.id}`, 403, {
      rating: 4,
      content: '타 점주 수정 차단',
    });
    await expectStatus('owner', 'patch', `/api/admin/reviews/${ownerManagedReview.review.id}`, 200, {
      rating: 4,
      content: `점주 수정 성공 ${RUN_ID}`,
    });
    await expectStatus('admin', 'delete', `/api/admin/reviews/${ownerManagedReview.review.id}`, 204);
    cleanupIds.reviews.delete(ownerManagedReview.review.id);
  });

  test('Q&A: USER 본인만 public 수정삭제 가능하고 답변/타인/미로그인은 차단된다', async () => {
    await expectStatus('anonymous', 'get', '/api/board/qna', 200);
    await expectStatus('anonymous', 'post', '/api/board/qna', 401, { question: '미로그인 질문' });

    const qnaId = await createQnaAs('user');
    await expectStatus('user', 'patch', `/api/board/qna/${qnaId}`, 200, {
      question: `본인 질문 수정 성공 ${RUN_ID}`,
    });
    await expectStatus('owner', 'patch', `/api/board/qna/${qnaId}`, 403, {
      question: '점주라도 public route에서 타인 질문 수정 불가',
    });
    await expectStatus('admin', 'delete', `/api/board/qna/${qnaId}`, 403);
    await expectStatus('user', 'delete', `/api/board/qna/${qnaId}`, 200);
    cleanupIds.qna.delete(qnaId);

    const lockedQnaId = await createQnaAs('user');
    await expectStatus('owner', 'patch', `/api/admin/qna/${lockedQnaId}`, 200, {
      question: `점주 관리 수정으로 답변 전환 ${RUN_ID}`,
    });
    await prisma.qnA.update({ where: { id: lockedQnaId }, data: { status: 'ANSWERED' } });
    await expectStatus('user', 'patch', `/api/board/qna/${lockedQnaId}`, 409, {
      question: '답변 후 수정 차단',
    });
    await expectStatus('user', 'delete', `/api/board/qna/${lockedQnaId}`, 409);
  });

  test('관리 Q&A: ADMIN/해당 OWNER만 수정삭제 가능하고 USER/타 OWNER는 차단된다', async () => {
    await expectStatus('anonymous', 'get', '/api/admin/qna', 401);
    await expectStatus('user', 'get', '/api/admin/qna', 403);
    await expectStatus('owner', 'get', '/api/admin/qna', 200);
    await expectStatus('admin', 'get', '/api/admin/qna', 200);

    const ownerShopQnaId = await createQnaAs('user', seed.ownerShopId);
    await expectStatus('otherOwner', 'patch', `/api/admin/qna/${ownerShopQnaId}`, 403, {
      question: '타 점주 관리 수정 차단',
    });
    await expectStatus('user', 'delete', `/api/admin/qna/${ownerShopQnaId}`, 403);
    await expectStatus('owner', 'patch', `/api/admin/qna/${ownerShopQnaId}`, 200, {
      question: `해당 점주 관리 수정 성공 ${RUN_ID}`,
    });
    await expectStatus('admin', 'delete', `/api/admin/qna/${ownerShopQnaId}`, 204);
    cleanupIds.qna.delete(ownerShopQnaId);

    const otherShopQnaId = await createQnaAs('user', seed.otherShopId);
    await expectStatus('owner', 'delete', `/api/admin/qna/${otherShopQnaId}`, 404);
    await expectStatus('otherOwner', 'delete', `/api/admin/qna/${otherShopQnaId}`, 204);
    cleanupIds.qna.delete(otherShopQnaId);
  });

  test('제휴문의: public create는 허용하고 상태변경/삭제는 ADMIN만 허용한다', async () => {
    await expectStatus('anonymous', 'post', '/api/board/partnership', 400, {
      shopName: '',
      region: 'seoul',
    });
    const inquiryId = await createPartnershipAsAnonymous();

    for (const actor of ['anonymous', 'user', 'owner'] as const) {
      await expectStatus(actor, 'patch', `/api/admin/partnerships/${inquiryId}`, actor === 'anonymous' ? 401 : 403, {
        status: 'contacted',
      });
      await expectStatus(actor, 'delete', `/api/admin/partnerships/${inquiryId}`, actor === 'anonymous' ? 401 : 403);
    }

    await expectStatus('admin', 'patch', `/api/admin/partnerships/${inquiryId}`, 200, {
      status: 'contacted',
    });
    await expectStatus('admin', 'delete', `/api/admin/partnerships/${inquiryId}`, 204);
    cleanupIds.partnerships.delete(inquiryId);
  });
});
