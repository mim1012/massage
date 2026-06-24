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

test('auth login page defers session probing while keeping the admin shortcut local-only and the redirect copy neutral', async () => {
  const loginPageSource = await readProjectFile('src/app/auth/login/page.tsx');

  assert.equal(loginPageSource.includes("const shouldShowAdminShortcut = process.env.NODE_ENV === 'development';"), true);
  assert.equal(loginPageSource.includes('const shouldDeferSessionLookup = true;'), true);
  assert.equal(loginPageSource.includes("useAuthSession({ defer: shouldDeferSessionLookup })"), true);
  assert.equal(loginPageSource.includes("import { useRouter, useSearchParams } from 'next/navigation';"), true);
  assert.equal(loginPageSource.includes('router.replace(getPostLoginRedirect(result.user.role, redirectTo));'), true);
  assert.equal(loginPageSource.includes('window.location.assign(getPostLoginRedirect(result.user.role, redirectTo));'), false);
  assert.equal(loginPageSource.includes('window.location.replace(getPostLoginRedirect(user.role, redirectTo));'), false);
  assert.equal(loginPageSource.includes('type="submit"'), true);
  assert.equal(loginPageSource.includes("{activeTab === 'user' && shouldShowAdminShortcut ? ("), true);
  assert.equal(loginPageSource.includes('로그인되었습니다. 이동 중입니다.'), true);
  assert.equal(loginPageSource.includes('로그인되었습니다. 관리자 화면으로 이동 중입니다.'), false);
});
