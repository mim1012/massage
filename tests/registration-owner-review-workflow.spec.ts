import { expect, request, test, type APIRequestContext } from '@playwright/test';
import { prisma } from '@/lib/db/prisma';
import type { Shop } from '@/lib/types';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3101';
const RUN_ID = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const adminCredentials = { email: 'admin@massage.local', password: 'admin1234' };
const seedShopSlug = 'healing-spa-seoul';

type LoginPayload = {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'OWNER' | 'USER';
    status?: 'pending' | 'approved' | 'rejected';
    managedShopId?: string | null;
  };
  error?: string;
};

function buildShopInput(_ownerId: string, suffix: string): Shop {
  const now = new Date().toISOString();
  return {
    id: `workflow-shop-${suffix}`,
    name: `워크플로우 테스트 업소 ${suffix}`,
    slug: `workflow-shop-${suffix}`,
    region: 'seoul',
    regionLabel: '서울',
    subRegion: 'gangnam',
    subRegionLabel: '강남',
    theme: 'swedish',
    themeLabel: '스웨디시',
    isPremium: true,
    premiumOrder: 99,
    thumbnailUrl: '',
    bannerUrl: '',
    detailImageUrl: '',
    images: [],
    tagline: '신규 승인 업주 테스트',
    description: '업주 승인 이후 업소 등록/수정 검증용 설명',
    address: '서울 강남구 테스트로 100',
    phone: '010-3333-4444',
    hours: '10:00 - 22:00',
    rating: 4.9,
    reviewCount: 0,
    courses: [],
    tags: ['테스트'],
    isVisible: true,
    ownerId: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

async function newApiContext() {
  return request.newContext({ baseURL: BASE_URL });
}

async function login(email: string, password: string, audience?: 'user' | 'owner') {
  const context = await newApiContext();
  const response = await context.post('/api/auth/login', {
    data: audience ? { email, password, audience } : { email, password },
  });
  return { context, response };
}

async function expectJson<T>(response: { json(): Promise<T> }) {
  return response.json();
}

test.describe('회원가입/승인/업소/리뷰 워크플로우', () => {
  test.describe.configure({ timeout: 180_000 });
  test.setTimeout(180_000);

  test('일반회원 가입부터 리뷰 수정/삭제, 업주 승인 후 업소 등록/리뷰 숨김/삭제까지 동작한다', async () => {
    const userEmail = `workflow-user-${RUN_ID}@example.com`;
    const ownerEmail = `workflow-owner-${RUN_ID}@example.com`;
    const userPassword = 'workflow-user-1234';
    const ownerPassword = 'workflow-owner-1234';
    const userName = `워크플로우 회원 ${RUN_ID}`;
    const ownerName = `워크플로우 업주 ${RUN_ID}`;
    const businessName = `워크플로우 업소 ${RUN_ID}`;
    const reviewContent = `자동화 리뷰 본문 ${RUN_ID}`;
    const updatedReviewContent = `자동화 리뷰 수정 ${RUN_ID}`;

    const contexts: APIRequestContext[] = [];
    const cleanup = {
      reviewIds: new Set<string>(),
      shopIds: new Set<string>(),
      userIds: new Set<string>(),
    };

    try {
      const seedShop = await prisma.shop.findUniqueOrThrow({ where: { slug: seedShopSlug } });

      const registerUserContext = await newApiContext();
      contexts.push(registerUserContext);
      const registerUserResponse = await registerUserContext.post('/api/auth/register/user', {
        data: {
          name: `  ${userName}  `,
          email: `  ${userEmail}  `,
          password: userPassword,
        },
      });
      expect(registerUserResponse.status()).toBe(201);
      const registerUserPayload = await expectJson<{ user: { id: string; email: string; name: string; role: 'USER' } }>(registerUserResponse);
      expect(registerUserPayload.user.email).toBe(userEmail);
      expect(registerUserPayload.user.name).toBe(userName);
      cleanup.userIds.add(registerUserPayload.user.id);

      const duplicateUserResponse = await registerUserContext.post('/api/auth/register/user', {
        data: { name: userName, email: userEmail, password: userPassword },
      });
      expect(duplicateUserResponse.status()).toBe(409);

      const adminLogin = await login(adminCredentials.email, adminCredentials.password);
      contexts.push(adminLogin.context);
      expect(adminLogin.response.status()).toBe(200);

      const adminUsersResponse = await adminLogin.context.get('/api/admin/users');
      expect(adminUsersResponse.status()).toBe(200);
      const adminUsersPayload = await expectJson<{ users: Array<{ id: string; email: string; role: string; name: string }> }>(adminUsersResponse);
      expect(adminUsersPayload.users.some((user) => user.id === registerUserPayload.user.id && user.email === userEmail && user.role === 'USER')).toBe(true);

      const userLogin = await login(userEmail, userPassword, 'user');
      contexts.push(userLogin.context);
      expect(userLogin.response.status()).toBe(200);

      const createReviewResponse = await userLogin.context.post('/api/board/reviews', {
        data: {
          shopId: seedShop.id,
          rating: 5,
          content: `  ${reviewContent}  `,
        },
      });
      expect(createReviewResponse.status()).toBe(201);
      const createReviewPayload = await expectJson<{ review: { id: string; content: string; canManage?: boolean; userId?: string } }>(createReviewResponse);
      const publicReviewId = createReviewPayload.review.id;
      cleanup.reviewIds.add(publicReviewId);
      expect(createReviewPayload.review.content).toBe(reviewContent);
      expect(createReviewPayload.review.canManage).toBe(true);
      expect('userId' in createReviewPayload.review).toBe(false);

      const blankReviewPatch = await userLogin.context.patch(`/api/board/reviews/${publicReviewId}`, {
        data: { rating: 4, content: '   ' },
      });
      expect(blankReviewPatch.status()).toBe(400);

      const updateReviewResponse = await userLogin.context.patch(`/api/board/reviews/${publicReviewId}`, {
        data: { rating: 4, content: `  ${updatedReviewContent}  ` },
      });
      expect(updateReviewResponse.status()).toBe(200);
      const updateReviewPayload = await expectJson<{ review: { content: string; rating: number; canManage?: boolean; userId?: string } }>(updateReviewResponse);
      expect(updateReviewPayload.review.content).toBe(updatedReviewContent);
      expect(updateReviewPayload.review.rating).toBe(4);
      expect(updateReviewPayload.review.canManage).toBe(true);
      expect('userId' in updateReviewPayload.review).toBe(false);

      const registerOwnerContext = await newApiContext();
      contexts.push(registerOwnerContext);
      const registerOwnerResponse = await registerOwnerContext.post('/api/auth/register/owner', {
        data: {
          name: `  ${ownerName}  `,
          email: `  ${ownerEmail}  `,
          password: ownerPassword,
          businessName: `  ${businessName}  `,
          businessNumber: '1234567890',
          phone: ' 010-5555-6666 ',
        },
      });
      expect(registerOwnerResponse.status()).toBe(201);
      const registerOwnerPayload = await expectJson<{
        user: { id: string; email: string; role: 'OWNER'; status?: 'pending' | 'approved' | 'rejected' };
        requiresApproval: boolean;
      }>(registerOwnerResponse);
      const ownerUserId = registerOwnerPayload.user.id;
      cleanup.userIds.add(ownerUserId);
      expect(registerOwnerPayload.user.email).toBe(ownerEmail);
      expect(registerOwnerPayload.user.status).toBe('pending');
      expect(registerOwnerPayload.requiresApproval).toBe(true);

      const duplicateOwnerResponse = await registerOwnerContext.post('/api/auth/register/owner', {
        data: {
          name: ownerName,
          email: ownerEmail,
          password: ownerPassword,
          businessName,
          businessNumber: '123-45-67890',
          phone: '010-5555-6666',
        },
      });
      expect(duplicateOwnerResponse.status()).toBe(409);

      const pendingOwnerLogin = await login(ownerEmail, ownerPassword, 'owner');
      contexts.push(pendingOwnerLogin.context);
      expect(pendingOwnerLogin.response.status()).toBe(403);
      const pendingOwnerPayload = await expectJson<LoginPayload>(pendingOwnerLogin.response);
      expect(pendingOwnerPayload.error).toBe('업주 계정은 관리자 승인 후 로그인할 수 있습니다.');
      await pendingOwnerLogin.context.dispose();
      contexts.pop();

      const approvalsResponse = await adminLogin.context.get('/api/admin/approvals');
      expect(approvalsResponse.status()).toBe(200);
      const approvalsPayload = await expectJson<{
        pendingUsers: Array<{ id: string; email: string; status?: string }>;
        processedUsers: Array<{ id: string; email: string; status?: string }>;
      }>(approvalsResponse);
      expect(approvalsPayload.pendingUsers.some((user) => user.id === ownerUserId && user.email === ownerEmail)).toBe(true);

      const approveOwnerResponse = await adminLogin.context.patch(`/api/admin/approvals/${ownerUserId}/approve`);
      expect(approveOwnerResponse.status()).toBe(200);
      const approveOwnerPayload = await expectJson<{ user: { id: string; status?: string } }>(approveOwnerResponse);
      expect(approveOwnerPayload.user.id).toBe(ownerUserId);
      expect(approveOwnerPayload.user.status).toBe('approved');

      const approvedOwnerLogin = await login(ownerEmail, ownerPassword, 'owner');
      contexts.push(approvedOwnerLogin.context);
      expect(approvedOwnerLogin.response.status()).toBe(200);
      const approvedOwnerPayload = await expectJson<LoginPayload>(approvedOwnerLogin.response);
      expect(approvedOwnerPayload.user?.email).toBe(ownerEmail);
      expect(approvedOwnerPayload.user?.role).toBe('OWNER');

      const ownerShopCreateResponse = await approvedOwnerLogin.context.post('/api/admin/shops', {
        data: {
          shop: buildShopInput(ownerUserId, RUN_ID),
        },
      });
      expect(ownerShopCreateResponse.status()).toBe(201);
      const ownerShopCreatePayload = await expectJson<{ shop: Shop }>(ownerShopCreateResponse);
      const ownerShopId = ownerShopCreatePayload.shop.id;
      cleanup.shopIds.add(ownerShopId);
      expect(ownerShopCreatePayload.shop.ownerId).toBe(ownerUserId);
      expect(ownerShopCreatePayload.shop.isVisible).toBe(true);
      expect(ownerShopCreatePayload.shop.isPremium).toBe(false);
      expect(ownerShopCreatePayload.shop.rating).toBe(0);

      const ownerManagedShopsResponse = await approvedOwnerLogin.context.get('/api/admin/shops');
      expect(ownerManagedShopsResponse.status()).toBe(200);
      const ownerManagedShopsPayload = await expectJson<{ shops: Array<{ id: string; ownerId?: string; isVisible: boolean; isPremium: boolean }> }>(ownerManagedShopsResponse);
      expect(ownerManagedShopsPayload.shops.some((shop) => shop.id === ownerShopId && shop.ownerId === ownerUserId)).toBe(true);

      const ownerShopPatchResponse = await approvedOwnerLogin.context.patch(`/api/admin/shops/${ownerShopId}`, {
        data: {
          shop: {
            ...ownerShopCreatePayload.shop,
            name: `업데이트된 업소 ${RUN_ID}`,
            phone: '010-7777-8888',
            description: '업데이트된 설명',
            isVisible: true,
            isPremium: true,
            premiumOrder: 3,
            ownerId: 'spoofed-owner-id',
          },
        },
      });
      expect(ownerShopPatchResponse.status()).toBe(200);
      const ownerShopPatchPayload = await expectJson<{ shop: Shop }>(ownerShopPatchResponse);
      expect(ownerShopPatchPayload.shop.name).toBe(`업데이트된 업소 ${RUN_ID}`);
      expect(ownerShopPatchPayload.shop.phone).toBe('010-7777-8888');
      expect(ownerShopPatchPayload.shop.description).toBe('업데이트된 설명');
      expect(ownerShopPatchPayload.shop.ownerId).toBe(ownerUserId);
      expect(ownerShopPatchPayload.shop.isVisible).toBe(true);
      expect(ownerShopPatchPayload.shop.isPremium).toBe(false);
      expect(ownerShopPatchPayload.shop.premiumOrder ?? null).toBe(null);

      const adminShopBeforeVisibility = await adminLogin.context.get(`/api/admin/shops/${ownerShopId}`);
      expect(adminShopBeforeVisibility.status()).toBe(200);
      const adminShopBeforeVisibilityPayload = await expectJson<{ shop: Shop }>(adminShopBeforeVisibility);
      const ownerShopVisibleResponse = await adminLogin.context.patch(`/api/admin/shops/${ownerShopId}`, {
        data: {
          shop: {
            ...adminShopBeforeVisibilityPayload.shop,
            isVisible: true,
            isPremium: true,
            premiumOrder: 1,
          },
        },
      });
      expect(ownerShopVisibleResponse.status()).toBe(200);
      const ownerShopVisiblePayload = await expectJson<{ shop: Shop }>(ownerShopVisibleResponse);
      expect(ownerShopVisiblePayload.shop.isVisible).toBe(true);
      expect(ownerShopVisiblePayload.shop.isPremium).toBe(true);
      expect(ownerShopVisiblePayload.shop.premiumOrder).toBe(1);

      const ownerShopReviewResponse = await userLogin.context.post('/api/board/reviews', {
        data: {
          shopId: ownerShopId,
          rating: 5,
          content: `업주 관리 리뷰 ${RUN_ID}`,
        },
      });
      expect(ownerShopReviewResponse.status()).toBe(201);
      const ownerShopReviewPayload = await expectJson<{ review: { id: string } }>(ownerShopReviewResponse);
      const ownerManagedReviewId = ownerShopReviewPayload.review.id;
      cleanup.reviewIds.add(ownerManagedReviewId);

      const ownerHideResponse = await approvedOwnerLogin.context.patch(`/api/admin/reviews/${ownerManagedReviewId}`, {
        data: { isHidden: true },
      });
      expect(ownerHideResponse.status()).toBe(200);
      const ownerHidePayload = await expectJson<{ review: { id: string; isHidden?: boolean } }>(ownerHideResponse);
      expect(ownerHidePayload.review.id).toBe(ownerManagedReviewId);
      expect(ownerHidePayload.review.isHidden).toBe(true);

      const hiddenPublicListResponse = await userLogin.context.get(`/api/board/reviews?shopId=${ownerShopId}&limit=20`);
      expect(hiddenPublicListResponse.status()).toBe(200);
      const hiddenPublicListPayload = await expectJson<{ reviews: Array<{ id: string }> }>(hiddenPublicListResponse);
      expect(hiddenPublicListPayload.reviews.some((review) => review.id === ownerManagedReviewId)).toBe(false);

      const ownerDeleteResponse = await approvedOwnerLogin.context.delete(`/api/admin/reviews/${ownerManagedReviewId}`);
      expect(ownerDeleteResponse.status()).toBe(204);
      cleanup.reviewIds.delete(ownerManagedReviewId);

      const ownerDeleteAgainResponse = await approvedOwnerLogin.context.delete(`/api/admin/reviews/${ownerManagedReviewId}`);
      expect(ownerDeleteAgainResponse.status()).toBe(404);

      const publicDeleteResponse = await userLogin.context.delete(`/api/board/reviews/${publicReviewId}`);
      expect(publicDeleteResponse.status()).toBe(200);
      cleanup.reviewIds.delete(publicReviewId);

      const publicDeleteAgainResponse = await userLogin.context.delete(`/api/board/reviews/${publicReviewId}`);
      expect(publicDeleteAgainResponse.status()).toBe(404);
    } finally {
      await Promise.all(contexts.map(async (context) => {
        try {
          await context.dispose();
        } catch {
          // ignore cleanup failures
        }
      }));
      await prisma.review.deleteMany({ where: { id: { in: [...cleanup.reviewIds] } } });
      await prisma.shop.deleteMany({ where: { id: { in: [...cleanup.shopIds] } } });
      await prisma.user.deleteMany({ where: { id: { in: [...cleanup.userIds] } } });
    }
  });
});
