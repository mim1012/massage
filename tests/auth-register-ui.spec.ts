import { expect, test } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const RUN_ID = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

test.describe('회원가입 UI 디테일', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('massage-adult-confirmed', 'true');
    });
  });

  test('회원가입 선택 페이지에서 일반회원/입점사 버튼이 각 가입 화면으로 이동한다', async ({ page }) => {
    await page.goto(`${BASE}/auth/register`, { waitUntil: 'domcontentloaded' });

    await page.locator('a[href="/auth/register/user"]').click();
    await page.waitForURL('**/auth/register/user', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '일반 고객 회원가입' })).toBeVisible({ timeout: 10000 });

    await page.goto(`${BASE}/auth/register`, { waitUntil: 'domcontentloaded' });
    await page.locator('a[href="/auth/register-owner"]').click();
    await page.waitForURL('**/auth/register-owner', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '입점사 회원가입' })).toBeVisible({ timeout: 10000 });
  });

  test('일반회원 가입 페이지에서 보기/토글/동의/가입 버튼이 모두 동작한다', async ({ page }) => {
    const userEmail = `ui-user-${RUN_ID}@example.com`;

    await page.goto(`${BASE}/auth/register/user`, { waitUntil: 'domcontentloaded' });

    const submitButton = page.getByRole('button', { name: '가입하기' });
    await expect(submitButton).toBeDisabled();

    await page.getByRole('button', { name: '보기' }).nth(0).click();
    await expect(page.getByText('제 1조 (목적)')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: '확인' }).click();
    await expect(page.getByText('제 1조 (목적)')).toHaveCount(0);

    await page.getByRole('button', { name: '보기' }).nth(1).click();
    await expect(page.getByRole('heading', { name: '개인정보 수집 및 이용 동의' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: '확인' }).click();
    await expect(page.getByRole('heading', { name: '개인정보 수집 및 이용 동의' })).toHaveCount(0);


    const passwordInput = page.locator('input[placeholder="비밀번호 (8자 이상)"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.locator('div.relative button[type="button"]').first().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await page.locator('div.relative button[type="button"]').first().click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.locator('input[placeholder="닉네임"]').fill('UI 일반회원');
    await page.locator('input[placeholder="아이디"]').fill(userEmail);
    await passwordInput.fill('secret1234');

    await page.locator('input[type="checkbox"]').nth(0).check();
    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.locator('input[type="checkbox"]').nth(2).check();
    await expect(submitButton).toBeEnabled();

    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/register/user') && response.request().method() === 'POST');
    await submitButton.click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);

    await expect(page.getByRole('heading', { name: '가입 완료!' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: '로그인하기' })).toHaveAttribute('href', '/auth/login');
  });

  test('입점사 가입 페이지에서 비밀번호 토글/불일치 경고/로그인 링크/가입 버튼이 동작한다', async ({ page }) => {
    const ownerEmail = `ui-owner-${RUN_ID}@example.com`;

    await page.goto(`${BASE}/auth/register-owner`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/auth/login');

    const passwordInput = page.locator('input[name="password"]');
    const confirmInput = page.locator('input[name="passwordConfirm"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(confirmInput).toHaveAttribute('type', 'password');

    await page.locator('input[name="password"]').fill('secret1234');
    await page.locator('input[name="passwordConfirm"]').fill('different1234');
    await page.locator('button[type="button"]').nth(0).click();
    await page.locator('button[type="button"]').nth(1).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(confirmInput).toHaveAttribute('type', 'text');

    await page.locator('input[name="id"]').fill(ownerEmail);
    await page.locator('input[name="name"]').fill('UI 업주');
    await page.locator('input[name="businessName"]').fill('UI 업소');
    await page.locator('input[name="businessNumber"]').fill('1234567890');
    await page.locator('input[name="phone"]').fill('010-2222-3333');
    await page.getByRole('button', { name: '입점 신청하기' }).click();
    await expect(page.getByText('비밀번호가 일치하지 않습니다.').first()).toBeVisible({ timeout: 10000 });

    await confirmInput.fill('secret1234');
    await passwordInput.fill('secret1234');
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/auth/register/owner') && response.request().method() === 'POST');
    await page.getByRole('button', { name: '입점 신청하기' }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);

    await page.waitForURL('**/auth/login?notice=pending-approval', { timeout: 10000 });
    await expect(page.getByText('관리자 승인 후 로그인할 수 있습니다.')).toBeVisible({ timeout: 10000 });
  });
});
