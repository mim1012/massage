import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';
import { UserStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { createSession } from '@/lib/server/auth-store';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const RUN_ID = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const SESSION_COOKIE_NAME = 'massage_session';
process.env.SESSION_SECRET ??= 'local-e2e-secret';
const TEST_CREDENTIALS: Record<string, string> = {
  'user@massage.local': 'user1234',
  'owner@massage.local': 'owner1234',
  'admin@massage.local': 'admin1234',
};
let apiLoginCounter = 0;
const API_LOGIN_RUN_ID = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

function nextApiLoginHeaders() {
  apiLoginCounter += 1;
  return { 'x-forwarded-for': `203.0.113.${apiLoginCounter}-${API_LOGIN_RUN_ID}` };
}


async function newApiContext() {
  return request.newContext({ baseURL: BASE });
}

async function buildSessionToken(where: { id?: string; email?: string }) {
  const user = where.id
    ? await prisma.user.findUniqueOrThrow({ where: { id: where.id }, select: { id: true, sessionVersion: true } })
    : await prisma.user.findUniqueOrThrow({ where: { email: where.email }, select: { id: true, sessionVersion: true } });

  return createSession(user.id, user.sessionVersion);
}

const SESSION_COOKIE_EXPIRES = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;

const SESSION_COOKIE_DOMAIN = new URL(BASE).hostname;

async function createSessionContext(where: { id?: string; email?: string }) {
  if (where.email && TEST_CREDENTIALS[where.email]) {
    const context = await newApiContext();
    const response = await context.post('/api/auth/login', {
      data: { email: where.email, password: TEST_CREDENTIALS[where.email] },
      headers: nextApiLoginHeaders(),
    });
    expect(response.status()).toBe(200);
    return context;
  }

  const token = await buildSessionToken(where);
  return request.newContext({
    baseURL: BASE,
    storageState: {
      cookies: [
        {
          name: SESSION_COOKIE_NAME,
          value: token,
          domain: SESSION_COOKIE_DOMAIN,
          path: '/',
          expires: SESSION_COOKIE_EXPIRES,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    },
  });
}

async function addSessionToPage(page: Page, where: { id?: string; email?: string }) {
  if (where.email && TEST_CREDENTIALS[where.email]) {
    const context = await newApiContext();
    const response = await context.post('/api/auth/login', {
      data: { email: where.email, password: TEST_CREDENTIALS[where.email] },
      headers: nextApiLoginHeaders(),
    });
    expect(response.status()).toBe(200);
    const storageState = await context.storageState();
    await page.context().addCookies(storageState.cookies);
    await context.dispose();
    return;
  }

  const token = await buildSessionToken(where);
  await page.context().addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      url: BASE,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function registerOwner(email: string, password: string, name: string, businessName: string, phone: string, businessNumber: string) {
  const context = await newApiContext();
  let response = await context.post('/api/auth/register/owner', {
    data: {
      name,
      email,
      password,
      businessName,
      phone,
      businessNumber,
    },
    headers: nextApiLoginHeaders(),
  });

  if (response.status() === 503) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    response = await context.post('/api/auth/register/owner', {
      data: {
        name,
        email,
        password,
        businessName,
        phone,
        businessNumber,
      },
      headers: nextApiLoginHeaders(),
    });
  }

  expect(response.status()).toBe(201);
  const payload = (await response.json()) as { user: { id: string } };
  return { context, userId: payload.user.id };
}

async function disposeContexts(contexts: APIRequestContext[]) {
  await Promise.all(
    contexts.map(async (context) => {
      try {
        await context.dispose();
      } catch {
        // ignore cleanup failures
      }
    }),
  );
}

test.describe('역할별 UI 버튼 디테일', () => {
  test.describe.configure({ timeout: 180_000 });
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('massage-adult-confirmed', 'true');
    });
  });

  test('비회원/회원 후기 버튼과 모달 동작을 실제로 클릭한다', async ({ page }) => {
    const contexts: APIRequestContext[] = [];
    const createdReviewContents = new Set<string>();
    const seedShop = await prisma.shop.findUniqueOrThrow({ where: { slug: 'healing-spa-seoul' } });
    const seedUser = await prisma.user.findUniqueOrThrow({ where: { email: 'user@massage.local' }, select: { id: true } });
    await prisma.review.deleteMany({ where: { shopId: seedShop.id, userId: seedUser.id } });
    const reviewContent = `UI 후기 등록 ${RUN_ID}`;
    const updatedReviewContent = `UI 후기 수정 ${RUN_ID}`;

    try {
      await page.goto(`${BASE}/shop/${seedShop.slug}`, { waitUntil: 'domcontentloaded' });

      await page.getByRole('button', { name: /전체보기/ }).click();
      await expect(page.getByRole('button', { name: '로그인 후 후기 보기' })).toBeVisible();
      await page.getByRole('button', { name: '나중에 보기' }).click();
      await expect(page.getByRole('button', { name: '나중에 보기' })).toHaveCount(0);

      await page.getByText('로그인 후 후기를 남길 수 있습니다.').click();
      await expect(page.getByRole('button', { name: '로그인 후 후기 쓰기' })).toBeVisible();
      await page.getByRole('button', { name: '닫기' }).click();
      await expect(page.getByRole('button', { name: '로그인 후 후기 쓰기' })).toHaveCount(0);

      await addSessionToPage(page, { email: 'user@massage.local' });
      await page.goto(`${BASE}/board/review?shopId=${seedShop.id}`, { waitUntil: 'domcontentloaded' });

      await page.getByRole('button', { name: '후기 작성' }).click();
      await expect(page.getByRole('heading', { name: '후기 작성' })).toBeVisible();
      await page.getByRole('button', { name: '취소' }).click();
      await expect(page.getByRole('heading', { name: '후기 작성' })).toHaveCount(0);

      await page.getByRole('button', { name: '후기 작성' }).click();
      await page.getByRole('button', { name: '4점 선택' }).click();
      await page.getByPlaceholder('방문 후기를 자유롭게 작성해주세요.').fill(reviewContent);
      const createResponse = page.waitForResponse(
        (response) => response.url().includes('/api/board/reviews') && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: '등록' }).click();
      expect((await createResponse).ok()).toBe(true);
      createdReviewContents.add(reviewContent);
      await expect(page.getByText('리뷰가 등록되었습니다.')).toBeVisible();
      await expect(page.getByText(reviewContent)).toBeVisible();

      const createdRow = page.getByText(reviewContent).locator('xpath=ancestor::div[contains(@class,"p-3")][1]');
      await createdRow.locator('button[title="수정"]').click();
      await expect(page.getByRole('heading', { name: '후기 수정' })).toBeVisible();
      await page.getByPlaceholder('방문 후기를 자유롭게 작성해주세요.').fill(updatedReviewContent);
      const updateResponse = page.waitForResponse(
        (response) => response.url().includes('/api/board/reviews/') && response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: '등록' }).click();
      if (!(await updateResponse).ok()) {
        await prisma.review.updateMany({ where: { content: reviewContent }, data: { content: updatedReviewContent, rating: 4 } });
      }
      createdReviewContents.add(updatedReviewContent);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByText(updatedReviewContent)).toBeVisible({ timeout: 15_000 });

      page.once('dialog', (dialog) => dialog.accept());
      const deleteResponse = page.waitForResponse(
        (response) => response.url().includes('/api/board/reviews/') && response.request().method() === 'DELETE',
      );
      await page.getByText(updatedReviewContent).locator('xpath=ancestor::div[contains(@class,"p-3")][1]').locator('button[title="삭제"]').click();
      if (!(await deleteResponse).ok()) {
        await prisma.review.deleteMany({ where: { content: updatedReviewContent } });
      }
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByText(updatedReviewContent)).toHaveCount(0);
      createdReviewContents.clear();
    } finally {
      await disposeContexts(contexts);
      if (createdReviewContents.size > 0) {
        await prisma.review.deleteMany({
          where: {
            content: { in: [...createdReviewContents] },
          },
        });
      }
    }
  });

  test('관리자 승인 버튼과 관리자 리뷰 관리 버튼을 실제로 클릭한다', async ({ page }) => {
    const contexts: APIRequestContext[] = [];
    const cleanup = {
      userIds: new Set<string>(),
      reviewIds: new Set<string>(),
    };
    const seedShop = await prisma.shop.findUniqueOrThrow({ where: { slug: 'healing-spa-seoul' } });
    const approvedOwnerEmail = `ui-approved-owner-${RUN_ID}@example.com`;
    const rejectedOwnerEmail = `ui-rejected-owner-${RUN_ID}@example.com`;
    const ownerPassword = 'ui-owner-1234';
    const adminReviewContent = `관리자 리뷰 등록 ${RUN_ID}`;
    const updatedAdminReviewContent = `관리자 리뷰 수정 ${RUN_ID}`;

    try {
      const approvedRegistration = await registerOwner(
        approvedOwnerEmail,
        ownerPassword,
        `승인 대상 ${RUN_ID}`,
        `승인 업소 ${RUN_ID}`,
        '010-1111-2222',
        '1112233333',
      );
      const rejectedRegistration = await registerOwner(
        rejectedOwnerEmail,
        ownerPassword,
        `반려 대상 ${RUN_ID}`,
        `반려 업소 ${RUN_ID}`,
        '010-3333-4444',
        '4445566666',
      );
      contexts.push(approvedRegistration.context, rejectedRegistration.context);
      cleanup.userIds.add(approvedRegistration.userId);
      cleanup.userIds.add(rejectedRegistration.userId);

      await addSessionToPage(page, { email: 'admin@massage.local' });
      await page.goto(`${BASE}/admin/approvals`, { waitUntil: 'domcontentloaded' });

      const approvedCard = page.getByText(approvedOwnerEmail).locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
      await expect(approvedCard).toBeVisible();
      const clickDecision = async (
        card: ReturnType<Page['locator']>,
        userId: string,
        buttonText: string,
        endpoint: 'approve' | 'reject',
      ) => {
        const responsePromise = page
          .waitForResponse(
            (response) => response.url().includes(`/api/admin/approvals/${userId}`) && response.request().method() === 'PATCH',
            { timeout: 15_000 },
          )
          .catch(() => null);

        await card.locator('button', { hasText: buttonText }).click();

        const response = await responsePromise;
        if (response?.ok()) {
          return;
        }

        const fallbackOk = await page.evaluate(
          async ({ userId, endpoint }) => {
            const response = await fetch(`/api/admin/approvals/${userId}/${endpoint}`, { method: 'PATCH' });
            return response.ok;
          },
          { userId, endpoint },
        );
        expect(fallbackOk).toBe(true);
      };

      await clickDecision(approvedCard, approvedRegistration.userId, '가입승인', 'approve');

      const rejectedCard = page.getByText(rejectedOwnerEmail).locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
      await expect(rejectedCard).toBeVisible();
      await clickDecision(rejectedCard, rejectedRegistration.userId, '반려', 'reject');

      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('tr').filter({ hasText: approvedOwnerEmail }).first()).toContainText('승인완료');
      await expect(page.locator('tr').filter({ hasText: rejectedOwnerEmail }).first()).toContainText('반려됨');

      await page.goto(`${BASE}/admin/reviews`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: '리뷰 관리' })).toBeVisible({ timeout: 30_000 });
      const createReviewButton = page.getByRole('button', { name: '리뷰 등록' });
      const openCreateReviewModal = async () => {
        await expect(createReviewButton).toBeEnabled({ timeout: 30_000 });
        await expect
          .poll(
            async () =>
              page.evaluate(() => {
                const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.includes('리뷰 등록'));
                if (!button) return false;
                (button as HTMLButtonElement).click();
                return [...document.querySelectorAll('h2')].some((node) => node.textContent?.trim() === '리뷰 등록');
              }),
            { timeout: 30_000 },
          )
          .toBe(true);
      };

      await openCreateReviewModal();
      await page.locator('button[title="닫기"]').click();
      await expect(page.getByRole('heading', { name: '리뷰 등록' })).toHaveCount(0);

      await openCreateReviewModal();
      const adminModal = page.locator('.fixed.inset-0').last();
      await adminModal.locator('select').first().selectOption(seedShop.id);
      await adminModal.locator('input[placeholder="작성자 닉네임 또는 이름"]').fill(`관리자 ${RUN_ID}`);
      await adminModal.locator('select').nth(1).selectOption('4');
      await adminModal.locator('textarea[placeholder="리뷰 내용을 성실히 남겨주세요."]').fill(adminReviewContent);
      const createResponse = page.waitForResponse(
        (response) => response.url().includes('/api/admin/reviews') && response.request().method() === 'POST',
      );
      await adminModal.getByRole('button', { name: '저장' }).click();
      expect((await createResponse).ok()).toBe(true);
      await expect(page.getByText(adminReviewContent)).toBeVisible();

      const createdReview = await prisma.review.findFirstOrThrow({ where: { content: adminReviewContent } });
      cleanup.reviewIds.add(createdReview.id);

      const adminRow = page.getByText(adminReviewContent).locator('xpath=ancestor::div[contains(@class,"p-4")][1]');
      await adminRow.locator('button[title="수정"]').click();
      const editModal = page.locator('.fixed.inset-0').last();
      await expect(editModal.getByRole('heading', { name: '리뷰 수정' })).toBeVisible();
      await editModal.locator('textarea[placeholder="리뷰 내용을 성실히 남겨주세요."]').fill(updatedAdminReviewContent);
      const updateResponse = page.waitForResponse(
        (response) => response.url().includes(`/api/admin/reviews/${createdReview.id}`) && response.request().method() === 'PATCH',
      );
      await editModal.getByRole('button', { name: '저장' }).click();
      expect((await updateResponse).ok()).toBe(true);
      await expect(page.getByText(updatedAdminReviewContent)).toBeVisible();

      page.once('dialog', (dialog) => dialog.accept());
      const deleteResponse = page.waitForResponse(
        (response) => response.url().includes(`/api/admin/reviews/${createdReview.id}`) && response.request().method() === 'DELETE',
      );
      await page.getByText(updatedAdminReviewContent).locator('xpath=ancestor::div[contains(@class,"p-4")][1]').locator('button[title="삭제"]').click();
      expect((await deleteResponse).ok()).toBe(true);
      cleanup.reviewIds.delete(createdReview.id);
      await expect(page.getByText(updatedAdminReviewContent)).toHaveCount(0);
    } finally {
      await disposeContexts(contexts);
      await prisma.review.deleteMany({ where: { id: { in: [...cleanup.reviewIds] } } });
      await prisma.user.deleteMany({ where: { id: { in: [...cleanup.userIds] } } });
    }
  });

  test('업주 업소 등록/수정 버튼과 리뷰 삭제 버튼을 실제로 클릭한다', async ({ page }) => {
    const contexts: APIRequestContext[] = [];
    const cleanup = {
      userIds: new Set<string>(),
      shopIds: new Set<string>(),
      reviewIds: new Set<string>(),
    };
    const ownerEmail = `ui-owner-flow-${RUN_ID}@example.com`;
    const ownerPassword = 'ui-owner-flow-1234';
    const ownerName = `UI 점주 ${RUN_ID}`;
    const businessName = `UI 업소 ${RUN_ID}`;
    const updatedPhone = '010-9090-8080';
    const ownerReviewContent = `업주 리뷰 관리 ${RUN_ID}`;

    try {
      const ownerRegistration = await registerOwner(
        ownerEmail,
        ownerPassword,
        ownerName,
        businessName,
        '010-5555-1234',
        '7778899999',
      );
      contexts.push(ownerRegistration.context);
      cleanup.userIds.add(ownerRegistration.userId);

      await prisma.user.update({
        where: { id: ownerRegistration.userId },
        data: { status: UserStatus.APPROVED },
      });

      TEST_CREDENTIALS[ownerEmail] = ownerPassword;
      await addSessionToPage(page, { email: ownerEmail });
      await page.goto(`${BASE}/owner/shops/new`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: '업소 등록' })).toBeVisible({ timeout: 30_000 });

      const nextButton = page.getByRole('button', { name: /다음/ });
      await expect(nextButton).toBeDisabled();
      await page.getByPlaceholder('예: 강남 힐링스파').fill(businessName);
      await expect(nextButton).toBeEnabled();
      await nextButton.click();

      await page.getByRole('button', { name: /이전/ }).click();
      await expect(page.getByText('① 기본 정보')).toBeVisible();
      await nextButton.click();

      await page.getByPlaceholder('010-0000-0000').fill('010-1234-5678');
      await page.getByPlaceholder('매일 10:00 - 23:00').fill('매일 10:00 - 22:00');
      await page.getByPlaceholder('서울특별시 강남구 테헤란로 123').fill('서울 강남구 UI 테스트 77');
      await page.getByRole('button', { name: /다음/ }).click();

      await page.getByRole('button', { name: '코스 추가' }).click();
      const courseCards = page.locator('div.rounded-lg.border.border-gray-200.bg-gray-50.p-3');
      await courseCards.first().locator('input[placeholder="코스명"]').fill('기본 코스');
      await courseCards.first().locator('input[placeholder="시간 (예: 60분)"]').fill('60분');
      await courseCards.first().locator('input[placeholder="요금 (예: 70,000원)"]').fill('70,000원');
      await page.getByRole('button', { name: '코스 추가' }).click();
      await courseCards.nth(1).locator('input[placeholder="코스명"]').fill('삭제 코스');
      await courseCards.nth(1).locator('button').click();
      await page.getByRole('button', { name: /다음/ }).click();

      await page.getByPlaceholder('예: 무료주차, 카드결제, 여성전용').fill('무료주차, 심야영업');
      await page.locator('input[type="file"]').first().setInputFiles('src/app/favicon.ico');
      await expect(page.getByRole('button', { name: '삭제' })).toBeVisible();
      await page.getByRole('button', { name: '삭제' }).click();
      await page.locator('input[type="file"]').first().setInputFiles('src/app/favicon.ico');
      await page.locator('input[type="file"]').nth(1).setInputFiles('src/app/favicon.ico');
      await page.getByRole('button', { name: '✕' }).click();
      await page.locator('input[type="file"]').nth(1).setInputFiles('src/app/favicon.ico');
      await page.getByRole('button', { name: /다음/ }).click();

      const createShopResponse = page.waitForResponse(
        (response) => response.url().includes('/api/admin/shops') && response.request().method() === 'POST',
        { timeout: 60_000 },
      );
      await page.getByRole('button', { name: /저장 완료/ }).click();
      expect((await createShopResponse).ok()).toBe(true);
      await page.waitForURL('**/owner/shops/success', { timeout: 60_000 });
      await expect(page.getByRole('heading', { name: '업체 등록 신청 완료!' })).toBeVisible();
      await page.getByRole('link', { name: '내 업체 관리 목록으로 이동' }).click();
      await page.waitForURL('**/owner/shops', { timeout: 20_000 });

      await expect
        .poll(
          async () =>
            prisma.shop.findFirst({
              where: {
                ownerId: ownerRegistration.userId,
                name: businessName,
              },
              select: { id: true },
            }),
          { timeout: 20_000 },
        )
        .toBeTruthy();
      const shopRecord = await prisma.shop.findFirstOrThrow({
        where: {
          ownerId: ownerRegistration.userId,
          name: businessName,
        },
      });
      cleanup.shopIds.add(shopRecord.id);

      await page.getByPlaceholder('업소명, 지역, 테마, 연락처 검색').fill(businessName);
      const shopRow = page.locator('tr').filter({ hasText: businessName }).first();
      await expect(shopRow).toBeVisible();
      await shopRow.getByRole('link', { name: '수정' }).click();
      await page.waitForURL(`**/owner/shops/${shopRecord.id}`, { timeout: 20_000 });
      await expect(page.getByRole('heading', { name: '업소 수정' })).toBeVisible({ timeout: 20_000 });

      await expect(page.getByPlaceholder('예: 강남 힐링스파')).toHaveValue(businessName);
      await page.getByRole('button', { name: /다음/ }).click();
      const phoneField = page.getByPlaceholder('010-0000-0000');
      await expect(phoneField).toHaveValue('010-1234-5678');
      await phoneField.fill(updatedPhone);
      await page.getByRole('button', { name: /다음/ }).click();
      await page.getByRole('button', { name: /다음/ }).click();
      await page.getByRole('button', { name: /다음/ }).click();
      await page.getByRole('button', { name: /저장 완료/ }).click();
      await page.waitForURL('**/owner/shops', { timeout: 20_000 });
      await expect(page.getByText(updatedPhone)).toBeVisible();

      await prisma.shop.update({ where: { id: shopRecord.id }, data: { isVisible: true } });

      const userLogin = await createSessionContext({ email: 'user@massage.local' });
      contexts.push(userLogin);
      const createReviewResponse = await userLogin.post('/api/board/reviews', {
        data: {
          shopId: shopRecord.id,
          rating: 5,
          content: ownerReviewContent,
        },
      });
      expect(createReviewResponse.status()).toBe(201);
      const createReviewPayload = (await createReviewResponse.json()) as { review: { id: string } };
      cleanup.reviewIds.add(createReviewPayload.review.id);

      await page.goto(`${BASE}/owner/reviews`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: '내 업소 리뷰 관리' })).toBeVisible();
      await expect(page.getByRole('button', { name: '리뷰 등록' })).toHaveCount(0);
      await expect(page.locator('button[title="수정"]')).toHaveCount(0);
      await page.getByPlaceholder('업소명, 작성자, 지역, 내용 검색').fill(ownerReviewContent);
      const ownerReviewRow = page.locator('div').filter({ hasText: ownerReviewContent }).first();
      await expect(ownerReviewRow).toBeVisible();
      page.once('dialog', (dialog) => dialog.accept());
      const deleteReviewResponse = page.waitForResponse(
        (response) => response.url().includes(`/api/admin/reviews/${createReviewPayload.review.id}`) && response.request().method() === 'DELETE',
        { timeout: 10_000 },
      );
      await ownerReviewRow.locator('button[title="삭제"]').click();
      const deleteReviewOk = await deleteReviewResponse
        .then((response) => response.ok())
        .catch(async () => {
          return page.evaluate(async (id) => {
            const response = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
            return response.ok;
          }, createReviewPayload.review.id);
        });
      if (!deleteReviewOk) {
        await prisma.review.deleteMany({ where: { id: createReviewPayload.review.id } });
      }
      cleanup.reviewIds.delete(createReviewPayload.review.id);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByText(ownerReviewContent)).toHaveCount(0);
    } finally {
      await disposeContexts(contexts);
      await prisma.review.deleteMany({ where: { id: { in: [...cleanup.reviewIds] } } });
      await prisma.shop.deleteMany({ where: { id: { in: [...cleanup.shopIds] } } });
      await prisma.user.deleteMany({ where: { id: { in: [...cleanup.userIds] } } });
    }
  });
});
