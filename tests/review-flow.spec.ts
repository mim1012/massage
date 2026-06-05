import { test, expect } from '@playwright/test';

test.describe('리뷰 통합 테스트 (작성/수정/삭제)', () => {
  test.setTimeout(120_000);

  const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
  const TEST_SHOP_URL = `${BASE}/shop/healing-spa-seoul`;
  const TEST_CONTENT = '플레이라이트 자동화 테스트 리뷰입니다. ' + new Date().getTime();
  const UPDATED_CONTENT = '수정된 테스트 내용입니다. ' + new Date().getTime();

  test('리뷰 작성 및 데이터 검증', async ({ page }) => {
    // 1. 로그인 페이지 이동 및 로그인
    console.log('🚀 로그인 페이지 이동 중...');
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('massage-adult-confirmed', 'true');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    
    const loginForm = page.locator('main form').filter({ has: page.locator('input[placeholder="아이디"]') });
    await expect(loginForm).toBeVisible({ timeout: 60_000 });
    await loginForm.locator('input[placeholder="아이디"]').fill('user@massage.local');
    await loginForm.locator('input[placeholder="비밀번호"]').fill('user1234');
    
    console.log('🚀 로그인 버튼 클릭...');
    await loginForm.getByRole('button', { name: '로그인' }).click();

    // 로그인 완료 및 세션 반영 대기
    console.log('🔍 로그인 세션 반영 대기 중...');
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 20000 });
    await expect
      .poll(async () => {
        const session = await page.evaluate(async () => {
          const response = await fetch('/api/auth/me', { cache: 'no-store' });
          const data = (await response.json()) as { user?: { email?: string | null } | null };
          return data.user?.email ?? null;
        });
        return session;
      }, { timeout: 20000 })
      .toBe('user@massage.local');
    console.log('✅ 로그인 확인 완료 (user@massage.local)');

    // 2. 상점 상세 페이지 이동
    console.log('🚀 상세 페이지 이동 중...');
    await page.goto(TEST_SHOP_URL, { waitUntil: 'domcontentloaded' });
    
    // 페이지 로딩 및 세션 체크 대기
    await page.waitForLoadState('networkidle');

    // 3. 리뷰 입력 폼 활성화
    console.log('🔍 리뷰 폼 활성화 대기...');
    const placeholder = page.locator('text=방문 후기를 남겨주세요...');
    
    // 로그인이 안 된 상태의 메시지가 떠있다면 사라질 때까지 대기
    const loginRequiredMsg = page.locator('text=후기를 작성하려면 로그인이 필요합니다.');
    if (await loginRequiredMsg.isVisible()) {
      console.log('⏳ 로그인 정보 로딩 대기 중...');
      await expect(loginRequiredMsg).not.toBeVisible({ timeout: 15000 });
    }

    await placeholder.waitFor({ state: 'visible', timeout: 10000 });
    await placeholder.click();
    
    // 4. 리뷰 내용 입력 및 등록
    console.log('✍️ 리뷰 내용 입력 중...');
    await page.fill('textarea', TEST_CONTENT);
    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/board/reviews') &&
        response.request().method() === 'POST',
    );
    await page.click('button:has-text("후기 등록")');
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBe(true);
    const createPayload = (await createResponse.json()) as { review?: { id?: string; content?: string } };
    const reviewId = createPayload.review?.id;

    if (!reviewId) throw new Error('작성된 리뷰의 ID를 응답에서 찾을 수 없습니다.');

    // 5. 등록 확인
    console.log('🔍 등록된 리뷰 확인 중...');
    await page.reload();
    await expect(page.locator('p').filter({ hasText: TEST_CONTENT })).toBeVisible({ timeout: 10000 });
    console.log('✅ 리뷰 작성 및 노출 확인 완료');

    // --- API 기반 수정/삭제 검증 ---
    console.log('🛠️ API 기반 수정/삭제 검증 시작...');
    console.log(`🔍 생성된 리뷰 ID: ${reviewId}`);

    // 6. 리뷰 수정
    const patchRes = await page.evaluate(async ({ id, content }) => {
      const res = await fetch(`/api/board/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, rating: 4 })
      });
      return res.ok;
    }, { id: reviewId, content: UPDATED_CONTENT });

    expect(patchRes).toBe(true);
    await page.reload();
    await expect(page.locator(`text=${UPDATED_CONTENT}`)).toBeVisible();
    console.log('✅ 리뷰 수정 및 반영 확인 완료');

    // 7. 리뷰 삭제
    const deleteRes = await page.evaluate(async (id) => {
      const res = await fetch(`/api/board/reviews/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    }, reviewId);

    expect(deleteRes).toBe(true);
    await page.reload();
    await expect(page.locator(`text=${UPDATED_CONTENT}`)).not.toBeVisible();
    console.log('✅ 리뷰 삭제 및 반영 확인 완료');
  });
});
