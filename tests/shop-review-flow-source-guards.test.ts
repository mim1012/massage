import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, '..');

async function readProjectFile(relativePath: string) {
  return fs.readFile(path.join(projectRoot, relativePath), 'utf8');
}

test('shop detail page keeps embedded review form above the review list', async () => {
  const source = await readProjectFile('src/app/shop/[slug]/page.tsx');

  assert.equal(source.includes("<ShopReviewForm shopId={shop.id} shopName={shop.name} />"), true);
  assert.equal(source.indexOf("<ShopReviewForm shopId={shop.id} shopName={shop.name} />") < source.indexOf('아직 후기가 없습니다.'), true);
});

test('shop review form preserves login redirect including current pathname and query', async () => {
  const source = await readProjectFile('src/components/public/ShopReviewForm.tsx');

  assert.equal(source.includes('usePathname'), true);
  assert.equal(source.includes('useSearchParams'), true);
  assert.equal(source.includes('const query = searchParams.toString();'), true);
  assert.equal(source.includes("const redirectPath = pathname ? `${pathname}${query ? `?${query}` : ''}` : '/';"), true);
  assert.equal(source.includes('return `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;'), true);
  assert.equal(source.includes('onClick={() => router.push(loginHref)}'), true);
});

test('shop review form keeps auth-loading guard and refreshes page after successful submit', async () => {
  const source = await readProjectFile('src/components/public/ShopReviewForm.tsx');

  assert.equal(source.includes('const [isAuthResolved, setIsAuthResolved] = useState(false);'), true);
  assert.equal(source.includes("fetch('/api/auth/me', { cache: 'no-store' })"), true);
  assert.equal(source.includes('로그인 상태를 확인하는 중입니다.'), true);
  assert.equal(source.includes("const response = await fetch('/api/board/reviews', {"), true);
  assert.equal(source.includes('setIsExpanded(false);'), true);
  assert.equal(source.includes('router.refresh();'), true);
});
