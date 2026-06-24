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

test('admin shops list avoids false-success quick edit modal and surfaces action failures', async () => {
  const source = await readProjectFile('src/components/admin/AdminShopsPageClient.tsx');

  assert.equal(source.includes("alert('수정된 기존 정보가 성공적으로 저장되었습니다.');"), false);
  assert.equal(source.includes('업소 정보 (빠른 수정)'), false);
  assert.match(source, /href=\{`\/admin\/shops\/\$\{shop\.id\}`\}/);
  assert.match(source, /setActionError\('노출 상태 변경에 실패했습니다\.'\)/);
  assert.match(source, /setActionError\('AD 상태 변경에 실패했습니다\.'\)/);
  assert.match(source, /getActionErrorMessage\(result, '노출 상태 변경에 실패했습니다\.'\)/);
  assert.match(source, /aria-pressed=\{shop\.isVisible\}/);
  assert.match(source, /aria-label=\{shop\.isVisible \? `\$\{shop\.name\} 노출 끄기` : `\$\{shop\.name\} 노출 켜기`\}/);
  assert.match(source, /aria-pressed=\{shop\.isPremium\}/);
  assert.match(source, /aria-label=\{shop\.isPremium \? `\$\{shop\.name\} AD 해제` : `\$\{shop\.name\} AD 등록`\}/);
});
