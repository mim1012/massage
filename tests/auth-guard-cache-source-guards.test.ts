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

test('auth user lookup selects only session and response fields on login and session checks', async () => {
  const authStoreSource = await readProjectFile('src/lib/server/auth-store.ts');

  assert.equal(authStoreSource.includes('const authUserSelect = {'), true);
  assert.equal(authStoreSource.includes('passwordHash: true'), true);
  assert.equal(authStoreSource.includes('sessionVersion: true'), true);
  assert.equal(authStoreSource.includes('ownerProfile: true'), true);
  assert.equal(authStoreSource.includes('select: authUserSelect'), true);
  const findUserByEmailSource = authStoreSource.match(/export async function findUserByEmail\(email: string\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  const sessionLookupSource = authStoreSource.match(/export async function getUserBySessionToken\(token: string \| undefined\) \{[\s\S]*?return sanitizeUser\(user\);/)?.[0] ?? '';
  assert.equal(findUserByEmailSource.includes('include: { ownerProfile: true }'), false);
  assert.equal(sessionLookupSource.includes('include: { ownerProfile: true }'), false);
});

test('session token hydration shares in-flight database work across concurrent route requests', async () => {
  const authStoreSource = await readProjectFile('src/lib/server/auth-store.ts');
  const inFlightSource = await readProjectFile('src/lib/server/in-flight.ts');

  assert.equal(authStoreSource.includes("import { getSharedInFlight } from '@/lib/server/in-flight';"), true);
  assert.equal(authStoreSource.includes('const sessionUserInFlight = new Map<string, Promise<User | null>>();'), true);
  assert.equal(authStoreSource.includes('return getSharedInFlight(sessionUserInFlight, token, async () => {'), true);
  assert.equal(authStoreSource.includes('sessionUserInFlight.delete(token);'), true);
  assert.equal(inFlightSource.includes('export function getSharedInFlight<T>('), true);
});
