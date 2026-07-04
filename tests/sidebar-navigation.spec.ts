import { expect, test, type Page } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
let apiLoginCounter = 0;

test.describe('사이드바/상단 메뉴 반영 검증', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('massage-adult-confirmed', 'true');
    });
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.locator('header')).toBeVisible({ timeout: 30_000 });
  });

  async function clickAndWaitForUrl(page: Page, link: ReturnType<Page['locator']>, expected: RegExp) {
    await expect(link).toBeVisible({ timeout: 30_000 });
    await link.click();
    await expect.poll(() => page.url(), { timeout: 30_000 }).toMatch(expected);
    await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
  }

  async function loginByApi(page: Page, email: string, password: string) {
    apiLoginCounter += 1;
    await page.evaluate(
      async ({ email, password, forwardedFor }) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': forwardedFor },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
          throw new Error(`login failed: ${response.status}`);
        }
      },
      { email, password, forwardedFor: `203.0.113.${apiLoginCounter}` },
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
  }

  test('desktop sidebar public menu links navigate to the expected service pages', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: 30_000 });

    await clickAndWaitForUrl(page, sidebar.getByRole('link', { name: /지역별 업소/ }), /\/?(\?.*)?$/);
    await expect(page.locator('aside .lnb-menu-item.active').first()).toContainText('전체보기');

    await clickAndWaitForUrl(page, sidebar.getByRole('link', { name: /서울/ }).first(), /region=seoul/);
    await expect(page.locator('aside').first()).toContainText('강남');

    await expect(sidebar.getByRole('link', { name: /주간 인기 추천업소/ })).toHaveAttribute('href', '/top100');

    await expect(page.locator('aside').first().getByRole('link', { name: /신규 등록 업소/ })).toHaveAttribute('href', '/?sort=new');

    await expect(sidebar.getByRole('link', { name: /공지사항/ })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: /Q&A 문의/ })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: /업소 후기/ })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: /광고안내/ })).toHaveCount(0);
  });

  test('top navigation links expose the main service sections', async ({ page }) => {
    const nav = page.locator('header').first();
    await expect(nav.getByRole('link', { name: '지역별업소' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '테마별업소' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '인기순위' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '커뮤니티' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '광고안내' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '고객센터' })).toBeVisible();

    await clickAndWaitForUrl(page, nav.getByRole('link', { name: '커뮤니티' }), /\/board/);
    await expect(page.locator('main').getByRole('link', { name: /공지|Q&A|후기|커뮤니티/ }).first()).toBeVisible({ timeout: 30_000 });
  });

  test('header account menu reflects anonymous, USER, OWNER and ADMIN roles', async ({ page }) => {
    await expect(page.locator('header').getByRole('link', { name: '로그인' }).first()).toBeVisible();
    await expect(page.locator('header').getByRole('link', { name: '회원가입' }).first()).toBeVisible();

    await loginByApi(page, 'user@massage.local', 'user1234');
    await expect(page.locator('header')).toContainText('김철수', { timeout: 30_000 });
    await expect(page.locator('header').getByRole('link', { name: 'MY' }).first()).toBeVisible();
    await expect(page.locator('header').getByRole('button', { name: /로그아웃/ }).first()).toBeVisible();

    await page.evaluate(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
    });
    await loginByApi(page, 'owner@massage.local', 'owner1234');
    await expect(page.locator('header')).toContainText('점주', { timeout: 30_000 });
    await expect(page.locator('header').getByRole('link', { name: '내 업소관리' }).first()).toBeVisible();

    await page.evaluate(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
    });
    await loginByApi(page, 'admin@massage.local', 'admin1234');
    await expect(page.locator('header')).toContainText('관리자', { timeout: 30_000 });
    await expect(page.locator('header').getByRole('link', { name: '관리자' }).first()).toBeVisible();
  });
});
