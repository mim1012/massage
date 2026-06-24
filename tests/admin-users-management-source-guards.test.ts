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

test('admin users API is paginated, filtered, private, and exposes a PATCH action', async () => {
  const routeSource = await readProjectFile('src/app/api/admin/users/route.ts');
  const storeSource = await readProjectFile('src/lib/server/auth-store.ts');

  assert.match(routeSource, /parsePositiveInt\(searchParams\.get\('page'\), 1\)/);
  assert.match(routeSource, /pageSize: parsePositiveInt\(searchParams\.get\('pageSize'\), 20\)/);
  assert.match(routeSource, /query: searchParams\.get\('q'\)\?\.trim\(\) \|\| undefined/);
  assert.match(routeSource, /role: parseRole\(searchParams\.get\('role'\)\)/);
  assert.match(routeSource, /status: parseStatus\(searchParams\.get\('status'\)\)/);
  assert.match(routeSource, /'Cache-Control': 'private, no-store'/);
  assert.match(routeSource, /export async function PATCH/);
  assert.match(routeSource, /updateManagedUser/);

  assert.match(storeSource, /export async function listUsersPage/);
  assert.match(storeSource, /skip: \(page - 1\) \* pageSize/);
  assert.match(storeSource, /take: pageSize/);
  assert.match(storeSource, /prisma\.user\.count\(\{ where \}\)/);
  assert.match(storeSource, /ownerProfile: \{ is: \{ businessName: \{ contains: query/);
  assert.match(routeSource, /USER_STATUS_NOT_MANAGED/);
  assert.match(routeSource, /상태 변경은 업체관리자 승인 상태에만 적용됩니다\./);
  assert.match(storeSource, /targetUser\.role !== UserRole\.OWNER/);
  assert.match(routeSource, /USER_NAME_REQUIRED/);
  assert.match(routeSource, /이름을 입력해 주세요\./);
  assert.match(storeSource, /input\.name !== undefined && !trimmedName/);
  assert.match(storeSource, /approvedAt: new Date\(\)/);
  assert.match(storeSource, /approvedAt: null, approvedBy: null/);
});

test('admin users page uses API pagination and clickable edit/save controls', async () => {
  const pageSource = await readProjectFile('src/app/admin/users/page.tsx');

  assert.match(pageSource, /const PAGE_SIZE = 20/);
  assert.match(pageSource, /fetch\(`\/api\/admin\/users\?\$\{params\.toString\(\)\}`/);
  assert.match(pageSource, /const \[debouncedQuery, setDebouncedQuery\] = useState\(''\)/);
  assert.match(pageSource, /window\.setTimeout\(\(\) => \{[\s\S]*setDebouncedQuery\(query\.trim\(\)\);[\s\S]*\}, 250\)/);
  assert.match(pageSource, /if \(debouncedQuery\.trim\(\)\) nextParams\.set\('q', debouncedQuery\.trim\(\)\);/);
  assert.match(pageSource, /const requestSeq = useRef\(0\)/);
  assert.match(pageSource, /if \(requestSeq\.current !== requestId\)/);
  assert.match(pageSource, /status: editing\.role === 'OWNER' \? editing\.status : undefined/);
  assert.match(pageSource, /상태 변경은 업체관리자 승인 상태에만 적용됩니다\./);
  assert.match(pageSource, /const \[modalError, setModalError\] = useState<string \| null>\(null\)/);
  assert.match(pageSource, /setModalError\(caughtError instanceof Error \? caughtError\.message : '회원 정보를 저장하지 못했습니다\.'\)/);
  assert.match(pageSource, /if \(!editing\.name\.trim\(\)\) \{[\s\S]*setModalError\('이름을 입력해 주세요\.'\);[\s\S]*return;[\s\S]*\}/);
  assert.match(pageSource, /cache: 'no-store'/);
  assert.match(pageSource, /credentials: 'same-origin'/);
  assert.match(pageSource, /onClick=\{\(\) => openEditor\(user\)\}/);
  assert.match(pageSource, /onClick=\{\(\) => void saveUser\(\)\}/);
  assert.match(pageSource, /await loadUsers\(\)/);
  assert.match(pageSource, /setPage\(\(current\) => Math\.max\(1, current - 1\)\)/);
  assert.match(pageSource, /setPage\(\(current\) => Math\.min\(data\.totalPages, current \+ 1\)\)/);
  assert.equal(pageSource.includes('document.createElement'), false);
});
