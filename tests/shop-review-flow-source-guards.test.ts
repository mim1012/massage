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

test('shop detail page delegates review loading to a client section after the shell paints', async () => {
  const pageSource = await readProjectFile('src/app/shop/[slug]/page.tsx');
  const sectionSource = await readProjectFile('src/components/public/ShopReviewSection.tsx');

  assert.equal(pageSource.includes("import ShopReviewSection from '@/components/public/ShopReviewSection';"), true);
  assert.equal(pageSource.includes('<ShopReviewSection'), true);
  assert.equal(pageSource.includes('getSessionUser'), false);
  assert.equal(pageSource.includes("export const dynamic = 'force-dynamic';"), false);
  assert.equal(sectionSource.includes("<ShopReviewForm shopId={shopId} shopName={shopName} onRequireLogin={() => setGateIntent('write')} />"), true);
  assert.equal(sectionSource.includes('let reviewBody: React.ReactNode;'), true);
  assert.equal(sectionSource.includes('useAuthSession'), true);
  assert.equal(sectionSource.includes("fetch(`/api/shops/${encodeURIComponent(slug)}`"), true);
  assert.equal(sectionSource.includes('usePathname'), true);
  assert.equal(sectionSource.includes('useSearchParams'), true);
  assert.equal(sectionSource.includes("type ReviewGateIntent = 'view' | 'write';"), true);
  assert.equal(sectionSource.includes('후기는 회원만 확인 가능합니다.'), true);
  assert.equal(sectionSource.includes('후기 작성은 회원만 가능합니다.'), true);
  assert.equal(sectionSource.includes("onClick={() => setGateIntent('view')"), true);
  assert.equal(sectionSource.includes('locked-review-'), true);
});

test('shop review form preserves login redirect including current pathname and query', async () => {
  const source = await readProjectFile('src/components/public/ShopReviewForm.tsx');

  assert.equal(source.includes('usePathname'), true);
  assert.equal(source.includes('useSearchParams'), true);
  assert.equal(source.includes('const query = searchParams.toString();'), true);
  assert.equal(source.includes("const redirectPath = pathname ? `${pathname}${query ? `?${query}` : ''}` : '/';"), true);
  assert.equal(source.includes('return `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;'), true);
  assert.equal(source.includes('onRequireLogin?: () => void;'), true);
  assert.equal(source.includes('로그인 후 후기를 남길 수 있습니다.'), true);
  assert.equal(source.includes('회원 전용'), true);
  assert.equal(source.includes('onRequireLogin();'), true);
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
