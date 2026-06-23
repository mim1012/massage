import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string, password: string, audience: 'user' | 'owner' = 'user') {
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });

  if (audience === 'owner') {
    await page.getByRole('button', { name: /입점사\(업체\)/ }).click();
  }

  const idPlaceholder = audience === 'owner' ? '가입하신 대표 아이디' : '아이디';
  const form = page.locator('main form').filter({ has: page.locator(`input[placeholder="${idPlaceholder}"]`) });
  await expect(form).toBeVisible({ timeout: 60_000 });
  await form.locator(`input[placeholder="${idPlaceholder}"]`).fill(email);
  await form.locator('input[placeholder="비밀번호"]').fill(password);

  await form.getByRole('button', { name: '로그인' }).click();
  await waitForSession(page, email);
}

async function waitForSession(page: import('@playwright/test').Page, expectedEmail: string | null, timeout = 30000) {
  await expect.poll(
    async () => {
      try {
        const res = await page.evaluate(async () => {
          const r = await fetch('/api/auth/me', { cache: 'no-store' });
          const d = (await r.json()) as { user?: { email?: string | null } | null };
          return d.user?.email ?? null;
        });
        return res;
      } catch {
        return null;
      }
    },
    { timeout },
  ).toBe(expectedEmail);
}

test.describe('인증 플로우', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    // 성인 인증 게이트 우회 + 로그아웃 상태 보장
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      localStorage.setItem('massage-adult-confirmed', 'true');
      await fetch('/api/auth/logout', { method: 'POST' });
    });
  });

  test('LOGIN UI: 탭/토글/링크 버튼이 기대한 화면으로 이동하고 관리자 전용 링크는 숨겨진다', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: '일반 회원 로그인' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=관리자 전용 로그인')).toHaveCount(0);

    const passwordInput = page.locator('input[placeholder="비밀번호"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.locator('form .relative button[type="button"]').first().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await page.locator('form .relative button[type="button"]').first().click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: /입점사\(업체\)/ }).click();
    await expect(page.getByRole('heading', { name: '사장님 로그인' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[placeholder="가입하신 대표 아이디"]')).toBeVisible();

    await page.getByRole('link', { name: '비밀번호 찾기' }).click();
    await page.waitForURL('**/auth/forgot', { timeout: 10000 });

    await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: '회원가입 →' }).click();
    await page.waitForURL('**/auth/register', { timeout: 10000 });

    await page.locator('a[href="/auth/register/user"]').click();
    await page.waitForURL('**/auth/register/user', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '일반 고객 회원가입' })).toBeVisible({ timeout: 10000 });
  });

  // ─── 일반 유저 ───────────────────────────────────────────────
  test('USER: 로그인 → 헤더에 로그아웃 버튼 표시 → 로그아웃', async ({ page }) => {
    await login(page, 'user@massage.local', 'user1234');
    await waitForSession(page, 'user@massage.local');

    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

    // 로그아웃 버튼 보임
    const logoutBtn = page.locator('button', { hasText: '로그아웃' }).first();
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });

    // 클릭
    await logoutBtn.click();

    // 로그아웃 후 로그인 링크 보임
    await expect(page.locator('a[href="/auth/login"]').first()).toBeVisible({ timeout: 10000 });
    await waitForSession(page, null);
  });

  // ─── 오너 계정 ───────────────────────────────────────────────
  test('OWNER: 로그인 → 내 업소관리 버튼 + 로그아웃 버튼 표시 → 로그아웃', async ({ page }) => {
    await login(page, 'owner@massage.local', 'owner1234', 'owner');
    await waitForSession(page, 'owner@massage.local');

    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

    // "내 업소관리" 링크 보임
    const ownerLink = page.locator('a[href="/owner/shops"]').first();
    await expect(ownerLink).toBeVisible({ timeout: 10000 });

    // 로그아웃 버튼 보임
    const logoutBtn = page.locator('button', { hasText: '로그아웃' }).first();
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });

    // 로그아웃
    await logoutBtn.click();
    await expect(page.locator('a[href="/auth/login"]').first()).toBeVisible({ timeout: 10000 });
    await waitForSession(page, null);
  });

  // ─── OWNER 페이지에서 로그아웃 ───────────────────────────────
  test('OWNER: /owner/shops 에서 로그아웃 → /auth/login 리디렉션', async ({ page }) => {
    await login(page, 'owner@massage.local', 'owner1234', 'owner');
    await waitForSession(page, 'owner@massage.local');

    await page.goto(`${BASE}/owner/shops`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // 헤더 로그아웃 버튼 클릭
    const logoutBtn = page.locator('button', { hasText: '로그아웃' }).first();
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });
    await logoutBtn.click();

    // 로그인 페이지로 이동
    await page.waitForURL('**/auth/login', { timeout: 10000 });
  });

  // ─── 관리자 ──────────────────────────────────────────────────
  test('ADMIN: 로그인 → /admin 접근 가능', async ({ page }) => {
    await login(page, 'admin@massage.local', 'admin1234');
    await waitForSession(page, 'admin@massage.local');

    await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible({ timeout: 15_000 });
  });

  // ─── 승인 대기 오너 ──────────────────────────────────────────
  test('OWNER(PENDING): 로그인 실패 - 미승인 오류', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
    const form = page.locator('main form').filter({ has: page.locator('input[placeholder="아이디"]') });
    await expect(form).toBeVisible({ timeout: 60_000 });
    await form.locator('input[placeholder="아이디"]').fill('pending-owner@massage.local');
    await form.locator('input[placeholder="비밀번호"]').fill('pending1234');
    await form.getByRole('button', { name: '로그인' }).click();

    // 오류 메시지 표시 (로그인 페이지에 머뭄)
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
    // 로그인 실패 → 세션 없음
    await waitForSession(page, null);
  });

  // ─── 세션 지속성 ─────────────────────────────────────────────
  test('OWNER: 새로고침 후 세션 유지', async ({ page }) => {
    await login(page, 'owner@massage.local', 'owner1234', 'owner');
    await waitForSession(page, 'owner@massage.local');

    // 페이지 새로고침
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('header')).toBeVisible({ timeout: 30_000 });

    // 세션 여전히 유효
    await waitForSession(page, 'owner@massage.local');

    // 로그아웃 버튼 여전히 보임
    const logoutBtn = page.locator('button', { hasText: '로그아웃' }).first();
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });
  });
});
