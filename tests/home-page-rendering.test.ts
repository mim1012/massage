import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, '..');

test('home page does not force per-request dynamic rendering', async () => {
  const pageSource = await fs.readFile(path.join(projectRoot, 'src/app/page.tsx'), 'utf8');

  assert.equal(pageSource.includes("export const dynamic = 'force-dynamic';"), false);
});
