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

test('session guard memoizes user lookup per request so admin and owner layouts do not duplicate auth db reads', async () => {
  const guardsSource = await readProjectFile('src/lib/auth/guards.ts');

  assert.equal(guardsSource.includes("import { cache } from 'react';"), true);
  assert.equal(guardsSource.includes('const getCachedUserBySessionToken = cache(async (token: string | undefined) => getUserBySessionToken(token));'), true);
  assert.equal(guardsSource.includes('return await getCachedUserBySessionToken(token ?? undefined);'), true);
});
