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

test('app error boundaries replace the generic page load failure with a retry UI', async () => {
  const appErrorSource = await readProjectFile('src/app/error.tsx');
  const globalErrorSource = await readProjectFile('src/app/global-error.tsx');

  assert.equal(appErrorSource.includes("error.message === 'DATABASE_ERROR'"), true);
  assert.equal(appErrorSource.includes('페이지를 불러오지 못했습니다'), true);
  assert.equal(appErrorSource.includes('다시 시도'), true);
  assert.equal(appErrorSource.includes('홈으로 이동'), true);

  assert.equal(globalErrorSource.includes("error.message === 'DATABASE_ERROR'"), true);
  assert.equal(globalErrorSource.includes('<html lang="ko">'), true);
  assert.equal(globalErrorSource.includes('다시 시도'), true);
});
